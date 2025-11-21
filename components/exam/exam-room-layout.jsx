import React, { useState } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { X, Clock, Save, CheckCircle, AlertCircle, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/context/modal-context";
import { useExamEngine } from "@/hooks/useExamEngine";
import { QuestionRenderer } from "./question-renderer";
import { AudioPlayer } from "./audio-player";

/**
 * ExamRoomLayout
 * 
 * Full-screen layout for exam room (hides sidebar/header)
 * Provides focused exam experience
 */
export function ExamRoomLayout({ task, normalizedData, existingDraft, user }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  } = useExamEngine(task, normalizedData, existingDraft);

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
          title: "Confirm Submission",
          description: intl.formatMessage(
            { id: "You have {count} unanswered questions. Are you sure you want to submit?" },
            { count: unansweredCount }
          ),
          onConfirm: async () => {
            await handleFinalSubmit(false);
          },
        },
        "short"
      );
    } else {
      await handleFinalSubmit(false);
    }
  };

  // Auto-save status indicator
  const getAutoSaveStatusIcon = () => {
    switch (autoSaveStatus) {
      case "saving":
        return <Save size={16} className="animate-spin text-blue-500" />;
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Bar - Minimal, focused */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Task Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {task?.title}
              </h1>
              <p className="text-xs text-gray-500">
                {task?.task_type?.replace(/_/g, " ")}
              </p>
            </div>

            {/* Center: Progress & Auto-save */}
            <div className="flex items-center gap-6 mx-4">
              <div className="text-sm text-gray-600">
                {answeredCount} / {totalQuestions}{" "}
                {intl.formatMessage({ id: "answered" })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getAutoSaveStatusIcon()}
                <span>{getAutoSaveStatusText()}</span>
              </div>
            </div>

            {/* Right: Timer & Actions */}
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm ${
                    isTimeUp || timeRemaining < 300
                      ? "bg-red-100 text-red-700"
                      : timeRemaining < 600
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Clock size={16} />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              {/* Exit Button */}
              <Link
                href="/dashboard/my-tasks"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={intl.formatMessage({ id: "Exit Exam" })}
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
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {existingDraft && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  {intl.formatMessage({ id: "Resuming from saved draft" })}
                </p>
              </div>
            )}

            {currentSection && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentSection.title}
                </h2>
                {currentSection.instructions && (
                  <p className="text-gray-600 mb-4">{currentSection.instructions}</p>
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
                      <img
                        key={idx}
                        src={image.image_url || image.url}
                        alt={`Section image ${idx + 1}`}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Question */}
            {currentQuestion ? (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                {intl.formatMessage({ id: "No question selected" })}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mb-6">
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {intl.formatMessage({ id: "Next" })}
              </button>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting || isTimeUp}
                className="w-full px-6 py-3 bg-main text-white rounded-lg font-semibold hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? intl.formatMessage({ id: "Submitting..." })
                  : intl.formatMessage({ id: "Finish Exam" })}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

