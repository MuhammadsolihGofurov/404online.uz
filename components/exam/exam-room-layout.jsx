import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { X, Clock, Save, CheckCircle, AlertCircle, Lock, Menu, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/context/modal-context";
import { useExamEngine } from "@/hooks/useExamEngine";
import { useExamStatus } from "@/hooks/useExamStatus";
import { QuestionRenderer } from "./question-renderer";
import { AudioPlayer } from "./audio-player";
import { SplitScreenLayout } from "./SplitScreenLayout";
import { PracticeResultsModal } from "./practice-results-modal";
import { QuestionPalette } from "./QuestionPalette";
import { RichText } from "@/components/ui/RichText";
import { ZoomableImage } from "@/components/common/ZoomableImage";
import { toast } from "react-toastify";

/**
 * ExamRoomLayout - Optimized & Refactored
 * 
 * Features:
 * 1. Global Audio Player (Persists across sections)
 * 2. Zoomable Images (Lightbox support)
 * 3. Strict Mode enforcement
 * 4. Prominent Timer
 */
export function ExamRoomLayout({ task, normalizedData, existingDraft, user, mode = 'exam', templateId = null, onSubmissionComplete = null }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [practiceResults, setPracticeResults] = useState(null);
  const [showPracticeResults, setShowPracticeResults] = useState(false);
  const [submissionId, setSubmissionId] = useState(existingDraft?.id || null);
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const toggleReview = (questionId) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const isPracticeMode = mode === 'practice';
  const isTemplatePractice = isPracticeMode && templateId !== null;
  const isExamMock = task?.task_type === 'EXAM_MOCK';
  
  // Initialize exam status hook
  const useStatusHook = !isPracticeMode && !isTemplatePractice && task?.id;
  const {
    examStatus,
    isLoading: statusLoading,
    currentSection: apiCurrentSection,
    sectionTimeRemaining,
    totalTimeRemaining,
    isStrictMode: apiStrictMode,
    allowsSectionSwitching,
    sections: apiSections,
    completeSection: apiCompleteSection,
    switchSection: apiSwitchSection,
    isSectionAccessible,
    isActionPending,
  } = useExamStatus(submissionId, useStatusHook);
  
  const isStrictMode = useStatusHook ? (apiStrictMode || false) : (isExamMock && !isPracticeMode);

  const handleSubmissionCreated = (newId) => {
    if (newId && newId !== submissionId) {
      setSubmissionId(newId);
    }
  };

  const {
    answers,
    currentSectionIndex,
    currentQuestionIndex,
    timeRemaining,
    isTimeUp,
    autoSaveStatus,
    isSubmitting,
    updateAnswer,
    goToSection,
    goToQuestion,
    getCurrentQuestion,
    getAnswer,
    getAnsweredCount,
    handleFinalSubmit,
    formatTime,
  } = useExamEngine(task, normalizedData, existingDraft, mode, templateId, handleSubmissionCreated);

  // Smooth Timer Logic for Strict Mode (Auditorium Mode)
  const [displayTime, setDisplayTime] = useState(null);

  // Sync with server time when it updates
  useEffect(() => {
    if (useStatusHook && sectionTimeRemaining !== undefined) {
      setDisplayTime(sectionTimeRemaining);
    }
  }, [sectionTimeRemaining, useStatusHook]);

  // Local ticker to smooth out the 5s polling interval
  useEffect(() => {
    if (!useStatusHook) return;
    const interval = setInterval(() => {
      setDisplayTime((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [useStatusHook]);

  const effectiveTimeRemaining = useStatusHook 
    ? (displayTime !== null ? displayTime : sectionTimeRemaining)
    : timeRemaining;

  const currentQuestion = getCurrentQuestion();
  const currentSection = normalizedData?.sections?.[currentSectionIndex];
  const totalQuestions = normalizedData?.totalQuestions || 0;
  const answeredCount = getAnsweredCount();

  const getSectionType = (sectionIndex) => {
    const section = normalizedData?.sections?.[sectionIndex];
    if (!section) return null;
    const mockType = (section.mock_type || section.type || section.title || '').toUpperCase();
    if (mockType.includes('LISTENING')) return 'LISTENING';
    if (mockType.includes('READING')) return 'READING';
    if (mockType.includes('WRITING')) return 'WRITING';
    return null;
  };

  const currentSectionType = getSectionType(currentSectionIndex);
  const isReadingSection = currentSectionType === 'READING';
  const isListeningSection = currentSectionType === 'LISTENING';
  const isWritingSection = currentSectionType === 'WRITING';

  // Compute Global Audio URL from Mock level
  const activeAudioUrl = useMemo(() => {
    if (!currentSection || !task?.mocks) return null;
    
    // 1. Try to find mock by ID if section has it
    if (currentSection.mock_id) {
      const mock = task.mocks.find(m => m.id === currentSection.mock_id);
      if (mock?.audio_file) return mock.audio_file;
    }
    
    // 2. Fallback: Find first mock of matching type (Standard for Exams)
    // Only applicable for LISTENING sections
    if (currentSectionType === 'LISTENING') {
      const mock = task.mocks.find(m => m.mock_type === 'LISTENING');
      return mock?.audio_file || null;
    }

    return null;
  }, [currentSection, task, currentSectionType]);

  // Auto-advance section when timer expires
  useEffect(() => {
    if (!isStrictMode || !useStatusHook || sectionTimeRemaining === undefined || sectionTimeRemaining === null) return;
    
    if (sectionTimeRemaining === 0 && !isActionPending) {
      apiCompleteSection().then((result) => {
        if (result?.success && result?.nextSection) {
          const nextSectionIndex = normalizedData?.sections?.findIndex(
            s => getSectionType(normalizedData.sections.indexOf(s)) === result.nextSection
          );
          if (nextSectionIndex !== -1) goToSection(nextSectionIndex);
        } else if (result?.success && !result?.nextSection) {
          toast.info("All sections completed! Submitting your exam...");
          handleFinalSubmit(true);
        }
      });
    }
  }, [sectionTimeRemaining, isStrictMode, isActionPending, useStatusHook]);

  // Real-time Deadline Enforcement
  useEffect(() => {
    if (!task?.deadline) return;
    
    const deadlineTime = new Date(task.deadline).getTime();
    
    const checkDeadline = () => {
      const now = Date.now();
      if (now >= deadlineTime) {
        if (!isSubmitting) {
             toast.warning(intl.formatMessage({ id: "Deadline reached. Submitting your answers..." }));
             handleFinalSubmit(true);
        }
      }
    };

    const msUntilDeadline = deadlineTime - Date.now();
    
    if (msUntilDeadline <= 0) {
       checkDeadline();
    } else {
       const timer = setTimeout(checkDeadline, msUntilDeadline);
       return () => clearTimeout(timer);
    }
  }, [task?.deadline, isSubmitting]);

  const handleSubmitClick = async () => {
    const unansweredCount = totalQuestions - answeredCount;
    const confirmMessage = unansweredCount > 0 
      ? intl.formatMessage({ id: "You have {count} unanswered questions. Are you sure you want to submit?" }, { count: unansweredCount })
      : null;

    if (confirmMessage) {
      openModal("confirmModal", {
        title: isPracticeMode ? "Confirm Practice Check" : "Confirm Submission",
        description: confirmMessage,
        onConfirm: performSubmit,
      }, "short");
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    const result = await handleFinalSubmit(false);
    if (result?.isPractice && result?.results) {
      setPracticeResults({ ...result.results, questions: result.questions || [] });
      setShowPracticeResults(true);
    } else if (result?.success && !result?.shouldRedirect && onSubmissionComplete) {
      onSubmissionComplete(result.submission);
    }
  };

  const getAutoSaveStatusIcon = () => {
    switch (autoSaveStatus) {
      case "saving": return <Save size={16} className="text-blue-500 animate-spin" />;
      case "saved": return <CheckCircle size={16} className="text-green-500" />;
      case "error": return <AlertCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header Bar */}
      <header className={`sticky top-0 z-50 border-b ${isStrictMode ? "bg-red-50 border-red-200" : "bg-white border-gray-200"} shadow-sm transition-colors duration-300`}>
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Task Title */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu size={20} />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className={`text-lg font-bold truncate ${isStrictMode ? "text-red-900" : "text-gray-900"}`}>
                    {task?.title}
                  </h1>
                  {isStrictMode && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                      OFFICIAL EXAM
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium ${isStrictMode ? "text-red-600" : "text-gray-500"}`}>
                  {task?.task_type?.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {/* Center: Prominent Timer */}
            <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
                {effectiveTimeRemaining !== null && effectiveTimeRemaining !== undefined && (
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold shadow-sm border transition-colors ${
                    (effectiveTimeRemaining < 300 || (useStatusHook ? effectiveTimeRemaining === 0 : isTimeUp))
                      ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                      : isStrictMode ? "bg-white text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}>
                    <Clock size={20} />
                    <span>
                      {formatTime(effectiveTimeRemaining)}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">Time Remaining</span>
            </div>

            {/* Right: Progress & Exit */}
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end mr-4">
                  <div className="text-sm font-semibold text-gray-700">
                    {answeredCount} / {totalQuestions} Answered
                  </div>
                  {!isPracticeMode && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      {getAutoSaveStatusIcon()}
                      <span>{autoSaveStatus === 'saved' ? 'Progress Saved' : 'Saving...'}</span>
                    </div>
                  )}
               </div>
              <Link
                href={isPracticeMode && templateId ? "/dashboard/materials-hub?type=TRAINING_ZONE" : "/dashboard/my-tasks"}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                title="Exit Exam"
              >
                <X size={24} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px-72px)]">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 overflow-y-auto bg-white border-r border-gray-200 hidden md:flex flex-col pb-20 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-20">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Exam Navigation
              </h2>
            </div>
            <div className="p-3 space-y-1.5">
              {normalizedData?.sections?.map((section, sectionIdx) => {
                const sectionType = getSectionType(sectionIdx);
                const apiSection = useStatusHook && sectionType 
                  ? apiSections?.find(s => s.type === sectionType)
                  : null;
                
                const sectionStatus = apiSection?.status || 'AVAILABLE';
                const isLocked = sectionStatus === 'LOCKED';
                const isCompleted = sectionStatus === 'COMPLETED';
                const isClickable = !isLocked && (allowsSectionSwitching || currentSectionIndex === sectionIdx || !isStrictMode);
                const isActive = currentSectionIndex === sectionIdx;
                
                return (
                  <button
                    key={section.id || sectionIdx}
                    onClick={() => {
                      if (!isClickable) return;
                      if (useStatusHook && allowsSectionSwitching && sectionIdx !== currentSectionIndex && sectionType) {
                        apiSwitchSection(sectionType).then((result) => {
                          if (result?.success) goToSection(sectionIdx);
                        });
                      } else {
                        goToSection(sectionIdx);
                      }
                    }}
                    disabled={!isClickable && !isActionPending}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                        : isLocked 
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                          : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <span className="truncate pr-2">{section.title || `Section ${sectionIdx + 1}`}</span>
                    {isLocked ? <Lock size={14} /> : isCompleted ? <CheckCircle size={16} className={isActive ? "text-white" : "text-green-500"} /> : isActive && <ChevronRight size={16} />}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/50">
          {/* 
             GLOBAL AUDIO PLAYER
             Rendered conditionally based on section type, but persistent across sub-section switches
             because the layout doesn't unmount, and activeAudioUrl stays stable.
          */}
          {isListeningSection && activeAudioUrl && (
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm p-4">
              <div className="max-w-4xl mx-auto">
                <AudioPlayer
                  audioUrl={activeAudioUrl}
                  strictMode={isStrictMode}
                  allowPause={task?.allow_audio_pause !== false}
                />
              </div>
            </div>
          )}

          {isReadingSection ? (
            <div className="flex-1 h-full overflow-hidden">
              <SplitScreenLayout
                passage={
                  <div className="space-y-8 pb-20 p-6 font-serif text-lg leading-relaxed text-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 font-sans mb-6 border-b pb-4">{currentSection?.title}</h2>
                    {currentSection?.instructions && (
                      <div className="prose max-w-none bg-blue-50 p-4 rounded-lg text-base mb-6 text-blue-800">
                        <RichText content={currentSection.instructions} />
                      </div>
                    )}
                    
                    {/* Reading Images - using ZoomableImage */}
                    {currentSection?.images?.map((image, idx) => (
                      <ZoomableImage
                        key={idx}
                        src={image.image || image.image_url || image.url}
                        alt={`Reading Passage ${idx + 1}`}
                        className="my-6 shadow-sm"
                      />
                    ))}
                    
                    {/* Passage Text */}
                    {currentSection?.text && <RichText content={currentSection.text} />}
                  </div>
                }
                questions={
                  <div className="flex-1 h-full overflow-y-auto pb-20 px-6 py-6 bg-gray-50/50">
                    {currentSection?.questions?.map((question, idx) => (
                      <div key={question.id} className="mb-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <QuestionRenderer
                          question={question}
                          value={getAnswer(question.id)}
                          onChange={(val) => updateAnswer(question.id, val)}
                          disabled={isSubmitting || (useStatusHook ? effectiveTimeRemaining === 0 : isTimeUp)}
                        />
                      </div>
                    ))}
                    {useStatusHook && isStrictMode && apiCurrentSection && (
                      <div className="mt-8">
                        <button
                          onClick={() => apiCompleteSection().then(res => {
                            if (res?.success && res?.nextSection) {
                              const nextIdx = normalizedData?.sections?.findIndex(s => getSectionType(normalizedData.sections.indexOf(s)) === res.nextSection);
                              if (nextIdx !== -1) goToSection(nextIdx);
                            }
                          })}
                          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                        >
                          Complete Reading Section
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          ) : (
            // Standard Layout (Listening & Writing)
            <div className="flex-1 overflow-y-auto pb-20 scroll-smooth">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {!isListeningSection && (
                   <div className="mb-8 border-b border-gray-200 pb-6">
                     <h2 className="text-3xl font-bold text-gray-900">{currentSection?.title}</h2>
                     {currentSection?.instructions && (
                        <div className="mt-4 text-gray-600 prose max-w-none">
                          <RichText content={currentSection.instructions} />
                        </div>
                     )}
                   </div>
                )}
                
                {/* Images for non-reading sections */}
                {currentSection?.images?.map((image, idx) => (
                  <ZoomableImage
                    key={idx}
                    src={image.image || image.image_url || image.url}
                    alt={`Section Image ${idx + 1}`}
                    className="mb-8 max-w-2xl mx-auto"
                  />
                ))}

                <div className="space-y-8">
                  {currentSection?.questions?.map((question, idx) => (
                    <div key={question.id} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <QuestionRenderer
                        question={question}
                        value={getAnswer(question.id)}
                        onChange={(val) => updateAnswer(question.id, val)}
                        disabled={isSubmitting || (useStatusHook ? effectiveTimeRemaining === 0 : isTimeUp)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-end border-t pt-8">
                  <button
                    onClick={handleSubmitClick}
                    className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    {isPracticeMode ? <CheckCircle size={20} /> : <Save size={20} />}
                    {isPracticeMode ? "Check Answers" : "Submit Task"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <QuestionPalette
        questions={currentSection?.questions || []}
        answers={answers}
        currentQuestionId={currentQuestion?.id}
        onSelectQuestion={(idx) => goToQuestion(currentSectionIndex, idx)}
        markedForReview={markedForReview}
        onToggleReview={toggleReview}
      />

      <PracticeResultsModal
        isOpen={showPracticeResults}
        onClose={() => setShowPracticeResults(false)}
        results={practiceResults}
        questions={normalizedData?.sections?.flatMap(s => s.questions || []) || []}
        userAnswers={answers}
        deadline={task?.deadline}
      />
    </div>
  );
}
