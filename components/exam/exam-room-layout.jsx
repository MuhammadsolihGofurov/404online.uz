import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { X, Clock, Save, CheckCircle, AlertCircle, Lock, Menu, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/context/modal-context";
import { useExamEngine } from "@/hooks/useExamEngine";
import { useExamStatus } from "@/hooks/useExamStatus";
import { QuestionRenderer } from "./question-renderer";
import { OptimizedQuestionRenderer } from "./OptimizedQuestionRenderer";
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
export function ExamRoomLayout({ task, template, normalizedData, existingDraft, user, mode = 'exam', templateId = null, onSubmissionComplete = null }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [practiceResults, setPracticeResults] = useState(null);
  const [showPracticeResults, setShowPracticeResults] = useState(false);
  const [submissionId, setSubmissionId] = useState(existingDraft?.id || null);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const mainRef = useRef(null);
  
  // PERFORMANCE FIX: Track listening section status without causing re-renders
  const listeningSectionStatusRef = useRef(null);

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

  // PERFORMANCE FIX: Timer using ref to avoid re-renders every second
  const displayTimeRef = useRef(null);
  const timerDisplayRef = useRef(null);
  const [timeForceUpdate, setTimeForceUpdate] = useState(0);

  // Sync with server time when it updates
  useEffect(() => {
    if (useStatusHook && sectionTimeRemaining !== undefined && sectionTimeRemaining !== null) {
      displayTimeRef.current = sectionTimeRemaining;
      // Update DOM directly without causing re-render
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = formatTime(sectionTimeRemaining);
      }
    }
  }, [sectionTimeRemaining, useStatusHook, formatTime]);

  // PERFORMANCE FIX: Update listening section status ref without causing re-renders
  useEffect(() => {
    if (apiSections?.length) {
      const status = apiSections.find(s => s.type === 'LISTENING')?.status;
      listeningSectionStatusRef.current = status;
    }
  }, [apiSections]);

  // PERFORMANCE FIX: Local ticker updates DOM directly - NO RE-RENDERS!
  useEffect(() => {
    if (!useStatusHook) return;
    
    const interval = setInterval(() => {
      if (displayTimeRef.current !== null && displayTimeRef.current !== undefined && displayTimeRef.current > 0) {
        displayTimeRef.current--;
        
        // Update DOM directly without triggering React re-render
        if (timerDisplayRef.current) {
          timerDisplayRef.current.textContent = formatTime(displayTimeRef.current);
          
          // Update styling for critical time warning
          const timerContainer = timerDisplayRef.current.parentElement;
          if (timerContainer) {
            if (displayTimeRef.current < 300) {
              timerContainer.classList.add('bg-red-100', 'text-red-700', 'border-red-300', 'animate-pulse');
              timerContainer.classList.remove('bg-white', 'text-red-800', 'border-red-200', 'bg-gray-100', 'text-gray-800', 'border-gray-200');
            }
          }
        }
        
        // Force re-render only when time hits 0 (for auto-progression logic)
        if (displayTimeRef.current === 0) {
          setTimeForceUpdate(Date.now());
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [useStatusHook, formatTime]);

  const effectiveTimeRemaining = useStatusHook
    ? (displayTimeRef.current !== null && displayTimeRef.current !== undefined ? displayTimeRef.current : sectionTimeRemaining)
    : timeRemaining;
  
  // Check if timer is actually initialized (not null/undefined)
  const isTimerInitialized = effectiveTimeRemaining !== null && effectiveTimeRemaining !== undefined;

  // PERFORMANCE FIX: Memoize expensive function calls
  const currentQuestion = useMemo(() => getCurrentQuestion(), [getCurrentQuestion]);
  const currentSection = normalizedData?.sections?.[currentSectionIndex];
  const totalQuestions = normalizedData?.totalQuestions || 0;
  const answeredCount = useMemo(() => getAnsweredCount(), [getAnsweredCount]);

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

  /**
   * Universal Audio URL Logic - Supports ALL modes
   * 
   * IELTS Standard: One audio file plays continuously across all parts (Part 1-4).
   * 
   * Priority Order:
   * 1. task.mocks[].audio_file - Regular Tasks/Exams/Assignments
   * 2. template.mocks[].audio_file - Training Zone/Self-Check
   * 3. normalizedData.mocks[].audio_file - Fallback if mocks passed separately
   * 4. currentSection.audio_file - Legacy/Direct section audio
   * 
   * The AudioPlayer is positioned in sticky header and will NOT unmount
   * when switching sections, maintaining continuous playback.
   */
  const activeAudioUrl = useMemo(() => {
    // 1. Only LISTENING sections need audio
    const type = (currentSectionType || '').toUpperCase();
    if (type !== 'LISTENING') return null;

    if (!currentSection) return null;

    // 2. Priority 1: Check task.mocks (Regular Tasks/Exams/Assignments)
    if (task?.mocks?.length) {
      // Try by mock_id first
      if (currentSection.mock_id) {
        const mock = task.mocks.find(m => m.id === currentSection.mock_id);
        if (mock?.audio_file) return mock.audio_file;
      }
      // Fallback: Find by mock_type
      const mock = task.mocks.find(m => m.mock_type === 'LISTENING');
      if (mock?.audio_file) return mock.audio_file;
    }

    // 3. Priority 2: Check template.mocks (Training Zone/Self-Check)
    if (template?.mocks?.length) {
      // Try by mock_id first
      if (currentSection.mock_id) {
        const mock = template.mocks.find(m => m.id === currentSection.mock_id);
        if (mock?.audio_file) return mock.audio_file;
      }
      // Fallback: Find by mock_type
      const mock = template.mocks.find(m => m.mock_type === 'LISTENING');
      if (mock?.audio_file) return mock.audio_file;
    }

    // 4. Priority 3: Check normalizedData.mocks (if mocks passed separately)
    if (normalizedData?.mocks?.length) {
      const mock = normalizedData.mocks.find(m => m.mock_type === 'LISTENING');
      if (mock?.audio_file) return mock.audio_file;
    }

    // 5. Priority 4: Direct section fallback (Legacy/Normalized data)
    if (currentSection.audio_file) {
      return currentSection.audio_file;
    }

    // No audio found - log warning for debugging
    console.warn('⚠️ LISTENING section detected but NO AUDIO FILE found.', {
      mode,
      hasTask: !!task,
      hasTemplate: !!template,
      hasNormalizedData: !!normalizedData,
      sectionTitle: currentSection?.title
    });

    return null;
  }, [currentSectionType, task, template, normalizedData, currentSection, mode]);

  // Auto-advance section when timer expires - Now uses timeForceUpdate trigger
  useEffect(() => {
    if (!isStrictMode || !useStatusHook) return;
    if (displayTimeRef.current !== 0 || isActionPending) return;

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
  }, [timeForceUpdate, isStrictMode, isActionPending, useStatusHook, apiCompleteSection, normalizedData?.sections, goToSection, handleFinalSubmit]);

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

  // BUG FIX: Reset scroll position when section changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentSectionIndex]);

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

            {/* Center: Prominent Timer - PERFORMANCE OPTIMIZED: Updates DOM directly */}
            <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
              {(effectiveTimeRemaining !== null && effectiveTimeRemaining !== undefined) && (
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold shadow-sm border transition-colors ${(effectiveTimeRemaining < 300 || (useStatusHook ? effectiveTimeRemaining === 0 : isTimeUp))
                  ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                  : isStrictMode ? "bg-white text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}>
                  <Clock size={20} />
                  <span ref={timerDisplayRef}>
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
                    <span>
                      {autoSaveStatus === 'saving' ? 'Saving...' : 
                       autoSaveStatus === 'saved' ? 'Progress Saved' : 
                       autoSaveStatus === 'error' ? 'Save Failed' : 
                       ''}
                    </span>
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

      {/* 
         AUDIO PLAYER - IELTS Standard Continuous Playback
         
         Positioned OUTSIDE main container (sticky header) to ensure:
         1. Always visible during LISTENING sections
         2. Continues playing when switching between Part 1-4
         3. Does NOT unmount/remount on section changes
         4. Maintains audio position across navigation
         
         IMPORTANT: Only show audio if section is IN_PROGRESS
         - Prevents audio replay if user somehow navigates back to completed listening section
         
         Audio source: mock.audio_file (one file for entire test)
      */}
      {useMemo(() => {
        if (!isListeningSection || !activeAudioUrl) return null;
        
        // PERFORMANCE FIX: Use ref instead of apiSections to avoid re-renders
        // Only show audio player if section is IN_PROGRESS (not COMPLETED or LOCKED)
        const shouldShowAudio = !isStrictMode || 
          listeningSectionStatusRef.current === 'IN_PROGRESS' || 
          !useStatusHook;
        
        if (!shouldShowAudio) return null;
        
        return (
          <div className="sticky top-16 z-50 bg-white border-b border-gray-200 shadow-md px-4 py-3">
            <div className="max-w-5xl mx-auto">
              <AudioPlayer
                audioUrl={activeAudioUrl}
                strictMode={isStrictMode}
                allowPause={task?.allow_audio_pause !== false}
              />
            </div>
          </div>
        );
      }, [isListeningSection, activeAudioUrl, isStrictMode, useStatusHook, task?.allow_audio_pause])}

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
                const isInProgress = sectionStatus === 'IN_PROGRESS';
                const isActive = currentSectionIndex === sectionIdx;

                // STRICT MODE LOGIC (EXAM_MOCK):
                // - LOCKED sections: Cannot access (future sections)
                // - COMPLETED sections: Cannot revisit (prevents audio replay)
                // - IN_PROGRESS section: Can only access current section
                // - Only current IN_PROGRESS section is clickable
                
                // PRACTICE MODE LOGIC:
                // - All sections always accessible (allows section switching)
                
                let isClickable;
                let tooltipMessage = "";
                
                if (isStrictMode) {
                  // Strict mode (EXAM_MOCK): Only current IN_PROGRESS section is accessible
                  if (isLocked) {
                    isClickable = false;
                    tooltipMessage = "This section is locked. Complete the previous section first.";
                  } else if (isCompleted) {
                    isClickable = false;
                    tooltipMessage = "This section is completed and cannot be revisited.";
                  } else if (isInProgress && isActive) {
                    isClickable = true;
                    tooltipMessage = "Current section";
                  } else {
                    isClickable = false;
                    tooltipMessage = "Only the current section is accessible in exam mode.";
                  }
                } else {
                  // Practice mode: Allow switching unless locked
                  isClickable = !isLocked && (allowsSectionSwitching || isActive);
                  if (isLocked) {
                    tooltipMessage = "This section is locked.";
                  }
                }

                return (
                  <button
                    key={section.id || sectionIdx}
                    onClick={() => {
                      if (!isClickable) {
                        if (tooltipMessage) {
                          toast.warning(tooltipMessage, { toastId: `section-${sectionIdx}` });
                        }
                        return;
                      }
                      
                      // Practice mode with section switching
                      if (useStatusHook && allowsSectionSwitching && sectionIdx !== currentSectionIndex && sectionType) {
                        apiSwitchSection(sectionType).then((result) => {
                          if (result?.success) {
                            goToSection(sectionIdx);
                            // Reset scroll position
                            setTimeout(() => {
                              const mainContent = document.querySelector('main[class*="flex-1"]');
                              if (mainContent) mainContent.scrollTop = 0;
                            }, 100);
                          }
                        });
                      } else if (!isStrictMode || isActive) {
                        // Only allow navigation if in practice mode or it's the active section
                        goToSection(sectionIdx);
                        // Reset scroll position
                        setTimeout(() => {
                          const mainContent = document.querySelector('main[class*="flex-1"]');
                          if (mainContent) mainContent.scrollTop = 0;
                        }, 100);
                      }
                    }}
                    disabled={!isClickable}
                    title={tooltipMessage}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group relative ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : isLocked
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                          : isCompleted
                            ? "bg-green-50 text-green-700 cursor-not-allowed border border-green-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <span className="truncate pr-2">{section.title || `Section ${sectionIdx + 1}`}</span>
                    <div className="flex items-center gap-1">
                      {isLocked && <Lock size={14} />}
                      {isCompleted && <CheckCircle size={16} className={isActive ? "text-white" : "text-green-600"} />}
                      {isActive && isInProgress && <ChevronRight size={16} className="animate-pulse" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Area */}
        <main ref={mainRef} className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/50">

          {/* Completed Section Warning Overlay */}
          {isStrictMode && currentSectionType && (() => {
            const currentSectionStatus = apiSections?.find(s => s.type === currentSectionType)?.status;
            return currentSectionStatus === 'COMPLETED' && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border-2 border-green-500">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Section Completed
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This section has been completed. You cannot revisit or modify answers in completed sections.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Please wait for automatic progression to the next section, or use the "Complete Section" button if available.
                  </p>
                </div>
              </div>
            );
          })()}

          {isReadingSection || isListeningSection ? (
            <div className="flex-1 h-full overflow-hidden">
              <SplitScreenLayout
                leftPaneTitle={isListeningSection ? "Section Images" : "Reading Passage"}
                passage={
                  <div className="space-y-6 pb-20 p-6">
                    {isListeningSection ? (
                      <>
                        {/* Listening: Show Images/Maps */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Images</h3>
                        </div>
                        {currentSection?.images && currentSection.images.length > 0 ? (
                          <div className="space-y-6">
                            {currentSection.images.map((image, idx) => (
                              <ZoomableImage
                                key={idx}
                                src={image.image || image.image_url || image.url}
                                alt={`Listening Map ${idx + 1}`}
                                className="shadow-md rounded-lg"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 italic">
                            No images available for this section
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Reading: Show Title, Instructions, Text, Images */}
                        <div className="font-serif text-lg leading-relaxed text-gray-800">
                          <h2 className="text-2xl font-bold text-gray-900 font-sans mb-6 border-b pb-4">{currentSection?.title}</h2>
                          {currentSection?.instructions && (
                            <div className="prose max-w-none bg-blue-50 p-4 rounded-lg text-base mb-6 text-blue-800">
                              <RichText content={currentSection.instructions} />
                            </div>
                          )}
                          {/* Passage Text */}
                          {currentSection?.text && <RichText content={currentSection.text} />}

                          {/* Images */}
                          {currentSection?.images?.map((image, idx) => (
                            <ZoomableImage
                              key={idx}
                              src={image.image || image.image_url || image.url}
                              alt={`Reading Passage ${idx + 1}`}
                              className="my-6 shadow-sm"
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                }
                questions={
                  <div className="flex-1 h-full overflow-y-auto pb-20 px-6 py-6 bg-gray-50/50">
                    {currentSection?.questions?.map((question, idx) => (
                      <div key={question.id} className="mb-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <OptimizedQuestionRenderer
                          question={question}
                          value={getAnswer(question.id)}
                          onAnswerUpdate={updateAnswer}
                          disabled={isSubmitting || (useStatusHook ? (isTimerInitialized && effectiveTimeRemaining === 0) : isTimeUp)}
                        />
                      </div>
                    ))}
                    {useStatusHook && isStrictMode && apiCurrentSection && (() => {
                      // Only show Complete Section button if current section is IN_PROGRESS
                      const currentSectionStatus = apiSections?.find(s => s.type === currentSectionType)?.status;
                      return currentSectionStatus === 'IN_PROGRESS' && (
                        <div className="mt-8">
                          <button
                            onClick={() => apiCompleteSection().then(res => {
                              if (res?.success && res?.nextSection) {
                                const nextIdx = normalizedData?.sections?.findIndex(s => getSectionType(normalizedData.sections.indexOf(s)) === res.nextSection);
                                if (nextIdx !== -1) goToSection(nextIdx);
                              } else if (res?.success && !res?.nextSection) {
                                // All sections completed, submit exam
                                toast.info("All sections completed! Submitting exam...");
                                handleFinalSubmit(true);
                              }
                            })}
                            disabled={isActionPending}
                            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            {isActionPending ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Completing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={20} />
                                <span>Complete Section & Continue</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                    {/* Manual Submit Button for Practice Mode - Only on Last Section */}
                    {(!useStatusHook || !isStrictMode) && (currentSectionIndex === (normalizedData?.sections?.length || 0) - 1) && (
                      <div className="mt-12 flex justify-end border-t pt-8">
                        <button
                          onClick={handleSubmitClick}
                          className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          {isPracticeMode ? <CheckCircle size={20} /> : <Save size={20} />}
                          {isPracticeMode ? "Check Answers" : "Submit Task"}
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          ) : (
            // Standard Layout (Writing)
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
                      <OptimizedQuestionRenderer
                        question={question}
                        value={getAnswer(question.id)}
                        onAnswerUpdate={updateAnswer}
                        disabled={isSubmitting || (useStatusHook ? (isTimerInitialized && effectiveTimeRemaining === 0) : isTimeUp)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-end border-t pt-8">
                  {(!useStatusHook || !isStrictMode) && (currentSectionIndex === (normalizedData?.sections?.length || 0) - 1) && (
                    <button
                      onClick={handleSubmitClick}
                      className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      {isPracticeMode ? <CheckCircle size={20} /> : <Save size={20} />}
                      {isPracticeMode ? "Check Answers" : "Submit Task"}
                    </button>
                  )}
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
