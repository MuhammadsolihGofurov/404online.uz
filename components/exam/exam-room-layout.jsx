import React, { useState } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { X, Clock, Save, CheckCircle, AlertCircle, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/context/modal-context";
import { useExamEngine } from "@/hooks/useExamEngine";
import { QuestionRenderer } from "./question-renderer";
import { AudioPlayer } from "./audio-player";
import { PracticeResultsModal } from "./practice-results-modal";
import { RichText } from "@/components/ui/RichText";

/**
 * ExamRoomLayout
 * 
 * Full-screen layout for exam room (hides sidebar/header)
 * Provides focused exam experience
 * 
 * @param {string} mode - 'practice' for practice mode, 'exam' for normal submission
 * @param {string} templateId - Template ID for template practice mode
 */
export function ExamRoomLayout({ task, normalizedData, existingDraft, user, mode = 'exam', templateId = null, onSubmissionComplete = null }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [practiceResults, setPracticeResults] = useState(null);
  const [showPracticeResults, setShowPracticeResults] = useState(false);

  const isPracticeMode = mode === 'practice';
  const isTemplatePractice = isPracticeMode && templateId !== null;
  const isExamMock = task?.task_type === 'EXAM_MOCK';
  const isStrictMode = isExamMock && !isPracticeMode;

  // Initialize exam engine
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
  } = useExamEngine(task, normalizedData, existingDraft, mode, templateId);

  const currentQuestion = getCurrentQuestion();
  const currentSection = normalizedData?.sections?.[currentSectionIndex];
  const totalQuestions = normalizedData?.totalQuestions || 0;
  const answeredCount = getAnsweredCount();

  // Handle final submit with confirmation
  const handleSubmitClick = async () => {
    const totalQuestions = normalizedData?.totalQuestions || 0;
    const answeredCount = getAnsweredCount();
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      openModal(
        "confirmModal",
        {
          title: isPracticeMode ? "Confirm Practice Check" : "Confirm Submission",
          description: intl.formatMessage(
            { id: "You have {count} unanswered questions. Are you sure you want to submit?" },
            { count: unansweredCount }
          ),
          onConfirm: async () => {
            const result = await handleFinalSubmit(false);
            if (result?.isPractice && result?.results) {
              // Training Zone: Show practice results modal
              setPracticeResults({
                ...result.results,
                questions: result.questions || [],
              });
              setShowPracticeResults(true);
            } else if (result?.success && !result?.shouldRedirect && onSubmissionComplete) {
              // Non-EXAM task: Show completion modal (replay workflow)
              onSubmissionComplete(result.submission);
            }
            // EXAM_MOCK: Redirect handled in useExamEngine
          },
        },
        "short"
      );
    } else {
      const result = await handleFinalSubmit(false);
      if (result?.isPractice && result?.results) {
        // Training Zone: Show practice results modal
        setPracticeResults({
          ...result.results,
          questions: result.questions || [],
        });
        setShowPracticeResults(true);
      } else if (result?.success && !result?.shouldRedirect && onSubmissionComplete) {
        // Non-EXAM task: Show completion modal (replay workflow)
        onSubmissionComplete(result.submission);
      }
      // EXAM_MOCK: Redirect handled in useExamEngine
    }
  };

  // Auto-save status indicator
  const getAutoSaveStatusIcon = () => {
    switch (autoSaveStatus) {
      case "saving":
        return <Save size={16} className="text-blue-500 animate-spin" />;
      case "saved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "error":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getAutoSaveStatusText = () => {
    switch (autoSaveStatus) {
      case "saving":
        return intl.formatMessage({ id: "Saving..." });
      case "saved":
        return intl.formatMessage({ id: "Saved" });
      case "error":
        return intl.formatMessage({ id: "Save failed" });
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header Bar - Minimal, focused */}
      <header className={`sticky top-0 z-50 border-b ${
        isStrictMode 
          ? "bg-red-50 border-red-200" 
          : "bg-blue-50 border-blue-200"
      }`}>
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Task Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-semibold truncate ${
                  isStrictMode ? "text-red-900" : "text-gray-900"
                }`}>
                  {task?.title}
                </h1>
                {isStrictMode && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                    {intl.formatMessage({ id: "OFFICIAL EXAM" })}
                  </span>
                )}
                {isPracticeMode && !isStrictMode && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {intl.formatMessage({ id: "Practice Mode" })}
                  </span>
                )}
                {!isPracticeMode && !isStrictMode && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {task?.task_type === 'QUIZ' 
                      ? intl.formatMessage({ id: "QUIZ" })
                      : intl.formatMessage({ id: "PRACTICE" })}
                  </span>
                )}
              </div>
              <p className={`text-xs ${
                isStrictMode ? "text-red-600" : "text-gray-500"
              }`}>
                {task?.task_type?.replace(/_/g, " ")}
              </p>
            </div>

            {/* Center: Progress & Auto-save */}
            <div className="flex items-center gap-6 mx-4">
              <div className="text-sm text-gray-600">
                {answeredCount} / {totalQuestions}{" "}
                {intl.formatMessage({ id: "answered" })}
              </div>
              {!isPracticeMode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getAutoSaveStatusIcon()}
                  <span>{getAutoSaveStatusText()}</span>
                </div>
              )}
            </div>

            {/* Right: Timer & Actions */}
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm ${
                    isTimeUp || timeRemaining < 300
                      ? isStrictMode
                        ? "bg-red-200 text-red-800 border-2 border-red-400"
                        : "bg-red-100 text-red-700"
                      : timeRemaining < 600
                      ? isStrictMode
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-yellow-100 text-yellow-700"
                      : isStrictMode
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Clock size={16} />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              {/* Exit Button */}
              <Link
                href={isPracticeMode && templateId ? "/dashboard/materials-hub?type=TRAINING_ZONE" : "/dashboard/my-tasks"}
                className="p-2 text-gray-500 transition-colors rounded-lg hover:text-gray-700 hover:bg-gray-100"
                title={intl.formatMessage({ id: isPracticeMode ? "Exit Practice" : "Exit Exam" })}
              >
                <X size={20} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Navigation */}
        {sidebarOpen && (
          <aside className="w-64 overflow-y-auto bg-white border-r border-gray-200">
            <div className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                {intl.formatMessage({ id: "Navigation" })}
              </h2>
              <div className="space-y-2">
                {normalizedData?.sections?.map((section, sectionIdx) => (
                  <div key={section.id} className="space-y-1">
                    <button
                      onClick={() => goToSection(sectionIdx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentSectionIndex === sectionIdx
                          ? "bg-main text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {section.title || `Section ${sectionIdx + 1}`}
                    </button>
                    {currentSectionIndex === sectionIdx && (
                      <div className="ml-4 space-y-1">
                        {section.questions?.map((question, questionIdx) => {
                          const questionAnswer = getAnswer(question.id);
                          const isAnswered = questionAnswer && Object.keys(questionAnswer).length > 0;
                          const isCurrent =
                            currentSectionIndex === sectionIdx &&
                            currentQuestionIndex === questionIdx;

                          return (
                            <button
                              key={question.id}
                              onClick={() => goToQuestion(sectionIdx, questionIdx)}
                              className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                                isCurrent
                                  ? "bg-main/20 text-main font-semibold"
                                  : isAnswered
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              Q{question.question_number}
                              {isAnswered && (
                                <span className="ml-2 text-green-500">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl px-4 py-6 mx-auto sm:px-6 lg:px-8">
            {existingDraft && (
              <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-700">
                  {intl.formatMessage({ id: "Resuming from saved draft" })}
                </p>
              </div>
            )}

            {currentSection && (
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  {currentSection.title}
                </h2>
                {currentSection.instructions && (
                  <div className="mb-4 text-gray-600">
                    <RichText content={currentSection.instructions} />
                  </div>
                )}

                {/* Audio Player for Listening sections */}
                {currentSection.audio_file && (
                  <div className="mb-6">
                    <AudioPlayer
                      audioUrl={currentSection.audio_file}
                      allowPause={task?.allow_audio_pause !== false}
                    />
                  </div>
                )}

                {/* Section Images */}
                {currentSection.images && currentSection.images.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {currentSection.images.map((image, idx) => (
                      <div key={image.id || idx} className="relative">
                        <img
                          src={image.image || image.image_url || image.url}
                          alt={image.caption || `Section image ${idx + 1}`}
                          className="w-full max-w-full border border-gray-200 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            // Open image in modal/lightbox on click
                            window.open(image.image || image.image_url || image.url, '_blank');
                          }}
                        />
                        {image.caption && (
                          <p className="mt-2 text-sm text-gray-600 text-center italic">
                            {image.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Question */}
            {currentQuestion ? (
              <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
                <QuestionRenderer
                  question={currentQuestion}
                  value={getAnswer(currentQuestion.id)}
                  onChange={(answerData) =>
                    updateAnswer(currentQuestion.id, answerData)
                  }
                  disabled={isSubmitting || isTimeUp}
                />
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                {intl.formatMessage({ id: "No question selected" })}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    goToQuestion(currentSectionIndex, currentQuestionIndex - 1);
                  } else if (currentSectionIndex > 0) {
                    const prevSection = normalizedData.sections[currentSectionIndex - 1];
                    const lastQuestionIdx = (prevSection?.questions?.length || 1) - 1;
                    goToQuestion(currentSectionIndex - 1, lastQuestionIdx);
                  }
                }}
                disabled={
                  currentSectionIndex === 0 && currentQuestionIndex === 0
                }
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {intl.formatMessage({ id: "Previous" })}
              </button>

              <button
                onClick={() => {
                  const currentSection = normalizedData.sections[currentSectionIndex];
                  const maxQuestionIdx = (currentSection?.questions?.length || 1) - 1;
                  
                  if (currentQuestionIndex < maxQuestionIdx) {
                    goToQuestion(currentSectionIndex, currentQuestionIndex + 1);
                  } else if (currentSectionIndex < (normalizedData.sections?.length || 1) - 1) {
                    goToQuestion(currentSectionIndex + 1, 0);
                  }
                }}
                disabled={
                  currentSectionIndex === (normalizedData.sections?.length || 1) - 1 &&
                  currentQuestionIndex ===
                    ((normalizedData.sections[currentSectionIndex]?.questions?.length || 1) - 1)
                }
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {intl.formatMessage({ id: "Next" })}
              </button>
            </div>

            {/* Submit Button */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting || isTimeUp}
                className={`w-full px-6 py-3 font-semibold text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isStrictMode
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-main hover:bg-main/90"
                }`}
              >
                {isSubmitting
                  ? intl.formatMessage({ id: "Submitting..." })
                  : isPracticeMode
                  ? intl.formatMessage({ id: "Check Answers" })
                  : isStrictMode
                  ? intl.formatMessage({ id: "Submit Exam" })
                  : intl.formatMessage({ id: "Finish Task" })}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Practice Results Modal */}
      <PracticeResultsModal
        isOpen={showPracticeResults}
        onClose={() => setShowPracticeResults(false)}
        results={practiceResults}
        questions={normalizedData?.sections?.flatMap(s => s.questions || []) || []}
        userAnswers={answers}
      />
    </div>
  );
}

