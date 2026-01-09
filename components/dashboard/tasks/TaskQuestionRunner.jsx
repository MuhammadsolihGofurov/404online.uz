import React, { useState, useEffect, useCallback, useRef } from "react";
import { useIntl } from "react-intl";
import { Maximize, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useQuestionSession } from "@/hooks/useQuestionSession";
import { getSectionConfig } from "@/utils/sectionConfig";
import ExamTimer from "@/components/dashboard/exams/exam-timer";
import ExamQuestion from "@/components/dashboard/exams/exam-question";
import ListeningFooter from "@/components/dashboard/exams/listening-footer";

/**
 * Generic component for running timed question-taking sessions
 * Used by both exam sections and homework items
 */
export default function TaskQuestionRunner({
  mode = "exam", // "exam" | "homework" | "mock"
  title,
  parentTitle,
  sectionType,
  durationMinutes,
  getMock,
  fetchMock,
  mockId,
  currentSubmissionId,
  startFn,
  submitFn,
  onFinalize,
  onTimeUpFinalize, // Optional: called instead of onFinalize when time runs out
  onExit,
  autoSaveConfig = null, // { onAutoSave, isSaving, lastSavedAt }
  isLoadingMock = false,
  isSubmitting = false,
  startError = null,
  onStartError = null,
}) {
  const intl = useIntl();
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const startedRef = useRef(false);
  const timeoutRef = useRef(null);

  // Initialize question session
  const {
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    partSummaries,
    activePartIndex,
    setActivePartIndex,
    currentQuestionNumber,
    focusQuestionNumber,
    questionNumberToIndexMap,
    isFullscreen,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSelectQuestion,
    handlePartSummariesChange,
    handlePartChangeFromFooter,
    handleStepPart,
    handleQuestionSelectFromFooter,
    handleFullscreen,
    resetSession,
    buildAnswersObject,
    hasAnswers,
  } = useQuestionSession({
    getMock,
    getSectionConfig,
    sectionType,
  });

  const currentMock = getMock(sectionType);

  // Load mock and start submission when component mounts or when mock becomes available
  useEffect(() => {
    if (!mockId || !sectionType || isStarted || startError) return;
    if (isStarting || startedRef.current) return;

    // Set a timeout to prevent infinite loading (30 seconds)
    timeoutRef.current = setTimeout(() => {
      if (!isStarted && isStarting) {
        const errorMsg = "Loading is taking too long. Please try again.";
        toast.error(errorMsg);
        onStartError?.(errorMsg);
        setIsStarting(false);
        startedRef.current = false;
      }
    }, 30000);

    const loadAndStart = async () => {
      setIsStarting(true);

      // First, ensure mock is loaded - use return value from fetchMock
      let mockToUse = getMock(sectionType);
      if (!mockToUse && fetchMock) {
        try {
          const fetchedMock = await fetchMock(sectionType, mockId);
          // Use the returned mock directly (fetchMock returns the response)
          mockToUse = fetchedMock;
          // If still no mock, wait a bit for state to update and check again
          if (!mockToUse) {
            await new Promise(resolve => setTimeout(resolve, 100));
            mockToUse = getMock(sectionType);
          }
        } catch (error) {
          const errorMsg = error?.message || "Failed to load questions";
          toast.error(errorMsg);
          onStartError?.(errorMsg);
          setIsStarting(false);
          return;
        }
      }

      // Final check - if still no mock, something went wrong
      if (!mockToUse) {
        mockToUse = getMock(sectionType);
        if (!mockToUse) {
          const errorMsg = "Failed to load mock data";
          toast.error(errorMsg);
          onStartError?.(errorMsg);
          setIsStarting(false);
          return;
        }
      }

      // Now start submission if mock is available and startFn is provided
      if (mockToUse) {
        if (startFn && !startedRef.current) {
          startedRef.current = true;
          try {
            const response = await startFn();
            if (response && !response.error) {
              setIsStarted(true);
              setIsStarting(false);
              // If API returns the mock, it should be set via setMockForSection in parent
            } else if (response?.error) {
              const errorMsg = response.message || startError || "Failed to start";
              toast.error(errorMsg);
              onStartError?.(errorMsg);
              startedRef.current = false; // Allow retry
              setIsStarting(false);
            } else {
              // response is null or undefined - proceed anyway (e.g., already submitted or resumed)
              setIsStarted(true);
              setIsStarting(false);
            }
          } catch (error) {
            const errorMsg = error?.message || "Failed to start";
            toast.error(errorMsg);
            onStartError?.(errorMsg);
            startedRef.current = false; // Allow retry
            setIsStarting(false);
          }
        } else if (!startFn) {
          // No startFn provided, just show the mock (for practice mode)
          setIsStarted(true);
          setIsStarting(false);
        } else {
          // Already processing, wait
          setIsStarting(false);
        }
      } else {
        setIsStarting(false);
      }
    };

    loadAndStart();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mockId, sectionType, currentMock, fetchMock, startFn, isStarted, isStarting, startError, onStartError, getMock]);

  // Navigation and refresh guards
  useEffect(() => {
    if (!isStarted || isSubmitting) return;

    // Block keyboard refresh
    const handleKeyDown = (e) => {
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) {
        e.preventDefault();
      }
    };

    // Block browser refresh/navigation
    const handleBeforeUnload = (e) => {
      const message = intl.formatMessage({
        id: "refresh.confirm",
        defaultMessage:
          "Are you sure you want to leave or refresh? Your progress may be lost.",
      });
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // Block back button (for homework mode)
    if (mode === "homework") {
      history.pushState(null, null, location.href);
      const handlePopState = () => {
        history.pushState(null, null, location.href);
        toast.warning(
          intl.formatMessage({
            id: "Cannot leave",
            defaultMessage: "You cannot leave the homework while taking a question.",
          })
        );
      };
      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    } else {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isStarted, isSubmitting, mode, intl]);

  // Auto-save for homework mode
  useEffect(() => {
    if (
      mode !== "homework" ||
      !autoSaveConfig?.onAutoSave ||
      !isStarted ||
      !currentSubmissionId ||
      !hasAnswers() ||
      !currentMock
    )
      return;

    const performAutoSave = async () => {
      const answersObj = buildAnswersObject(currentMock);
      await autoSaveConfig.onAutoSave(answersObj);
    };

    const timer = setTimeout(performAutoSave, 2000);
    return () => clearTimeout(timer);
  }, [
    answers,
    mode,
    isStarted,
    currentSubmissionId,
    hasAnswers,
    currentMock,
    buildAnswersObject,
    autoSaveConfig,
  ]);

  // Handle time up
  const handleTimeUp = useCallback(async () => {
    if (!currentMock || !currentSubmissionId) return;

    const answersObj = buildAnswersObject(currentMock);
    const result = await submitFn(answersObj, { force: true });

    if (result && result.success) {
      if (mode === "homework") {
        toast.info(
          intl.formatMessage({
            id: "Time up - auto submitted",
            defaultMessage: "Time is up! Your answers have been automatically submitted.",
          })
        );
      }
      // Use onTimeUpFinalize if provided, otherwise fall back to onFinalize
      if (onTimeUpFinalize) {
        onTimeUpFinalize();
      } else {
        onFinalize?.();
      }
    }
  }, [currentMock, currentSubmissionId, buildAnswersObject, submitFn, mode, onFinalize, onTimeUpFinalize, intl]);

  // Handle manual submit
  const handleSubmit = useCallback(async () => {
    if (!currentMock || !currentSubmissionId) return;

    const answersObj = buildAnswersObject(currentMock);
    const hasAtLeastOneAnswer = Object.values(answersObj).some(
      (val) => val !== null && val !== undefined && String(val).trim() !== ""
    );

    if (!hasAtLeastOneAnswer) {
      toast.error(
        intl.formatMessage({
          id: "At least one answer required",
          defaultMessage: "Please answer at least one question before submitting.",
        })
      );
      return;
    }

    const result = await submitFn(answersObj, { force: false });
    if (result && result.success) {
      toast.success(
        intl.formatMessage({
          id: "Submitted successfully",
          defaultMessage: "Submitted successfully!",
        })
      );
      onFinalize?.();
    }
  }, [currentMock, currentSubmissionId, buildAnswersObject, submitFn, onFinalize, intl]);

  // Show error state first (before loading)
  if (startError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <p className="text-red-700 mb-4">{startError}</p>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {intl.formatMessage({ id: "Go Back", defaultMessage: "Go Back" })}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show error if mockId is missing
  if (!mockId && sectionType) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <p className="text-red-700 mb-4">
            {intl.formatMessage({
              id: "Missing mock ID",
              defaultMessage: "Missing mock ID. Cannot load questions.",
            })}
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {intl.formatMessage({ id: "Go Back", defaultMessage: "Go Back" })}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  // Show loading if:
  // 1. We're actively loading the mock OR starting the submission
  // 2. AND we don't have an error
  // 3. AND we haven't started yet
  // 4. OR we don't have a mock yet and we're supposed to have one
  const shouldShowLoading =
    ((isLoadingMock || isStarting) && !startError && !isStarted) ||
    (!currentMock && mockId && !startError && !isStarted);

  if (shouldShowLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {intl.formatMessage({
              id: "Loading questions",
              defaultMessage: "Loading questions...",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (!currentMock) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {intl.formatMessage({
              id: "Failed to load questions",
              defaultMessage: "Failed to load questions",
            })}
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {intl.formatMessage({ id: "Go Back", defaultMessage: "Go Back" })}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gray-100 flex flex-col overflow-hidden fixed inset-0 z-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 line-clamp-1">{title}</h2>
          <p className="text-xs text-gray-500 line-clamp-1">
            {parentTitle}
            {autoSaveConfig && (
              <>
                {autoSaveConfig.isSaving && (
                  <span className="ml-2 text-blue-500">
                    {intl.formatMessage({ id: "Saving...", defaultMessage: "Saving..." })}
                  </span>
                )}
                {!autoSaveConfig.isSaving && autoSaveConfig.lastSavedAt && (
                  <span className="ml-2 text-green-500">
                    {intl.formatMessage({ id: "Saved", defaultMessage: "Saved" })}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {durationMinutes && durationMinutes > 0 && (
            <ExamTimer duration={durationMinutes} onTimeUp={handleTimeUp} />
          )}
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={intl.formatMessage({
              id: "Toggle Fullscreen",
              defaultMessage: "Toggle Fullscreen",
            })}
          >
            <Maximize size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? intl.formatMessage({ id: "Submitting...", defaultMessage: "Submitting..." })
              : mode === "homework"
                ? intl.formatMessage({ id: "Submit Task", defaultMessage: "Submit Task" })
                : intl.formatMessage({ id: "Submit Section", defaultMessage: "Submit Section" })}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <div
          className={`p-4 md:p-8 max-w-5xl mx-auto min-h-full ${partSummaries.length > 0 ? "pb-32" : ""
            }`}
        >
          <ExamQuestion
            mock={currentMock}
            sectionType={sectionType}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            onSelectQuestion={handleSelectQuestion}
            onPartSummariesChange={handlePartSummariesChange}
            onPartChange={handlePartChangeFromFooter}
            activePartIndex={activePartIndex}
            focusQuestionNumber={focusQuestionNumber}
            isPractice={mode === "mock"}
          />
        </div>
      </div>

      {/* Footer */}
      {partSummaries.length > 0 && (
        <ListeningFooter
          partSummaries={partSummaries}
          activePartIndex={activePartIndex}
          currentQuestionNumber={currentQuestionNumber}
          answers={answers}
          questionNumberToIndexMap={questionNumberToIndexMap}
          onPartChange={handlePartChangeFromFooter}
          onStepPart={handleStepPart}
          onQuestionSelect={handleQuestionSelectFromFooter}
        />
      )}
    </div>
  );
}
