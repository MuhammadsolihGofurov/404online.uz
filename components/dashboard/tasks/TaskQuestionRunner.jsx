import React, { useState, useEffect, useCallback, useRef } from "react";
import { useIntl } from "react-intl";
import { Maximize, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useQuestionSession } from "@/hooks/useQuestionSession";
import { getSectionConfig } from "@/utils/sectionConfig";
import fetcher from "@/utils/fetcher";
import ExamTimer from "@/components/dashboard/exams/exam-timer";
import ExamQuestion from "@/components/dashboard/exams/exam-question";
import ListeningFooter from "@/components/dashboard/exams/listening-footer";

const startRequestCache = new Map();

const hasQuestionIds = (mock) => {
  if (!mock) return false;

  const isUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const getQuestionId = (obj) =>
    obj?.id ??
    obj?.pk ??
    obj?.uuid ??
    obj?.question_id ??
    obj?.questionId ??
    obj?.question?.id ??
    obj?.question?.pk ??
    obj?.question?.uuid ??
    obj?.question?.question_id ??
    obj?.question?.questionId;

  if (Array.isArray(mock?.tasks)) {
    return mock.tasks.some((task) => {
      const id = getQuestionId(task);
      return !!id && isUuid(id);
    });
  }

  const groupHasIds = (group) => {
    if (!group) return false;
    if (Array.isArray(group.questions)) {
      return group.questions.some((question) => {
        const id = getQuestionId(question);
        return !!id && isUuid(id);
      });
    }
    const mapLike =
      group.question_ids ||
      group.questionIds ||
      group.question_id_map ||
      group.questionIdMap ||
      group.questions_by_number ||
      group.questionsByNumber ||
      group.question_map ||
      group.questionMap ||
      group.questions_map ||
      group.questions_list;
    if (Array.isArray(mapLike)) {
      return mapLike.some((entry) => {
        const id = getQuestionId(entry);
        return !!id && isUuid(id);
      });
    }
    if (mapLike && typeof mapLike === "object") {
      return Object.values(mapLike).some((entry) => {
        const id = getQuestionId(entry ?? {});
        if (id && isUuid(id)) return true;
        return isUuid(entry);
      });
    }
    return false;
  };

  const containerHasIds = (container) =>
    Array.isArray(container?.question_groups) &&
    container.question_groups.some(groupHasIds);

  if (Array.isArray(mock?.parts)) return mock.parts.some(containerHasIds);
  if (Array.isArray(mock?.passages)) return mock.passages.some(containerHasIds);
  if (Array.isArray(mock?.question_groups)) {
    return mock.question_groups.some(groupHasIds);
  }

  return false;
};

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
  setMockForSection,
  mockId,
  currentSubmissionId,
  startFn,
  submitFn,
  onFinalize,
  onTimeUpFinalize, // Optional: called instead of onFinalize when time runs out
  onExit,
  autoSaveConfig = null, // { onAutoSave, isSaving }
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
  const submitLockRef = useRef(false);
  const hydratedSubmissionRef = useRef(null);

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

  const currentMock = getMock(sectionType, mockId);

  // Load mock and start submission when component mounts or when mock becomes available
  useEffect(() => {
    if (!mockId || !sectionType || isStarted || startError) return;
    if (isStarting || startedRef.current) {
      return;
    }

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
      if (startedRef.current) return;
      startedRef.current = true;
      setIsStarting(true);

      // First, ensure mock is loaded - use return value from fetchMock
      let mockToUse = getMock(sectionType, mockId);
      if ((!mockToUse || !hasQuestionIds(mockToUse)) && fetchMock) {
        try {
          const fetchedMock = await fetchMock(sectionType, mockId, {
            force: !!mockToUse,
          });
          // Use the returned mock directly (fetchMock returns the response)
          mockToUse = fetchedMock;
          // If still no mock, wait a bit for state to update and check again
          if (!mockToUse) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            mockToUse = getMock(sectionType, mockId);
          }
        } catch (error) {
          console.error("[TaskQuestionRunner] Mock load failed:", error);
          const errorMsg = error?.message || "Failed to load questions";
          toast.error(errorMsg);
          onStartError?.(errorMsg);
          setIsStarting(false);
          startedRef.current = false; // Allow retry
          return;
        }
      }

      // Final check - if still no mock, something went wrong
      if (!mockToUse) {
        mockToUse = getMock(sectionType, mockId);
        if (!mockToUse) {
          console.error("[TaskQuestionRunner] Mock still missing after fetch.");
          const errorMsg = "Failed to load mock data";
          toast.error(errorMsg);
          onStartError?.(errorMsg);
          setIsStarting(false);
          startedRef.current = false; // Allow retry
          return;
        }
      }

      // Now start submission if mock is available and startFn is provided
      if (mockToUse) {
        if (currentSubmissionId && startFn) {
          setIsStarted(true);
          setIsStarting(false);
          return;
        }
        if (startFn) {
          try {
            const startKey = `${mode || "default"}:${sectionType}:${mockId}`;
            let startPromise = startRequestCache.get(startKey);
            if (!startPromise) {
              startPromise = startFn();
              startRequestCache.set(startKey, startPromise);
            }

            const response = await startPromise;
            if (startRequestCache.get(startKey) === startPromise) {
              startRequestCache.delete(startKey);
            }
            if (response && !response.error) {
              setIsStarted(true);
              setIsStarting(false);
            } else if (response?.error) {
              const errorMsg =
                response.message || startError || "Failed to start";
              toast.error(errorMsg);
              onStartError?.(errorMsg);
              startedRef.current = false; // Allow retry
              setIsStarting(false);
            } else {
              // response is null or undefined - proceed anyway (e.g., resumed)
              setIsStarted(true);
              setIsStarting(false);
            }
          } catch (error) {
            console.error("[TaskQuestionRunner] startFn failed:", error);
            const errorMsg = error?.message || "Failed to start";
            toast.error(errorMsg);
            onStartError?.(errorMsg);
            const startKey = `${mode || "default"}:${sectionType}:${mockId}`;
            if (startRequestCache.get(startKey)) {
              startRequestCache.delete(startKey);
            }
            startedRef.current = false; // Allow retry
            setIsStarting(false);
          }
        } else {
          if (currentSubmissionId) {
          }
          // No startFn provided, just show the mock (for practice mode)
          setIsStarted(true);
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
  }, [
    mockId,
    sectionType,
    currentMock,
    fetchMock,
    startFn,
    startError,
    onStartError,
    getMock,
    currentSubmissionId,
  ]);

  useEffect(() => {
    if (!currentSubmissionId || !currentMock || !setMockForSection) return;
    if (hasQuestionIds(currentMock)) return;
    if (hydratedSubmissionRef.current === currentSubmissionId) return;

    const hydrateFromSubmission = async () => {
      try {
        const submissionData = await fetcher(
          `/submissions/${currentSubmissionId}/`,
          {},
          {},
          true,
        );
        const submissionMock =
          submissionData?.mock ||
          submissionData?.content ||
          submissionData?.listening_mock ||
          submissionData?.reading_mock ||
          submissionData?.writing_mock ||
          submissionData?.quiz_mock ||
          null;

        if (submissionMock && hasQuestionIds(submissionMock)) {
          setMockForSection(sectionType, submissionMock, mockId);
          hydratedSubmissionRef.current = currentSubmissionId;
        }
      } catch (error) {
        console.warn(
          "[TaskQuestionRunner] Failed to hydrate mock from submission:",
          error,
        );
      }
    };

    hydrateFromSubmission();
  }, [
    currentSubmissionId,
    currentMock,
    mockId,
    sectionType,
    setMockForSection,
  ]);

  // Navigation and refresh guards
  useEffect(() => {
    if (!isStarted || isSubmitting) return;

    // Block keyboard refresh
    const handleKeyDown = (e) => {
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
      ) {
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
            defaultMessage:
              "You cannot leave the homework while taking a question.",
          }),
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

  const handleSaveAndExit = useCallback(async () => {
    if (
      mode !== "homework" ||
      !autoSaveConfig?.onAutoSave ||
      !currentMock ||
      !currentSubmissionId
    ) {
      return;
    }

    const answersObj = buildAnswersObject(currentMock);
    const result = await autoSaveConfig.onAutoSave(answersObj);
    const failed = result === false || result?.success === false;

    if (failed) {
      toast.error(
        result?.message ||
          intl.formatMessage({
            id: "Failed to save",
            defaultMessage: "Failed to save draft",
          }),
      );
      return;
    }

    toast.success(
      intl.formatMessage({
        id: "Saved",
        defaultMessage: "Saved",
      }),
    );
    onExit?.();
  }, [
    mode,
    autoSaveConfig,
    currentMock,
    currentSubmissionId,
    buildAnswersObject,
    onExit,
    intl,
  ]);

  // Handle time up
  const handleTimeUp = useCallback(async () => {
    if (!currentMock || !currentSubmissionId) return;
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    const answersObj = buildAnswersObject(currentMock);
    const result = await submitFn(answersObj, { force: true });

    if (result && result.success) {
      if (mode === "homework") {
        toast.info(
          intl.formatMessage({
            id: "Time up - auto submitted",
            defaultMessage:
              "Time is up! Your answers have been automatically submitted.",
          }),
        );
      }
      // Use onTimeUpFinalize if provided, otherwise fall back to onFinalize
      if (onTimeUpFinalize) {
        onTimeUpFinalize();
      } else {
        onFinalize?.();
      }
    }
    submitLockRef.current = false;
  }, [
    currentMock,
    currentSubmissionId,
    buildAnswersObject,
    submitFn,
    mode,
    onFinalize,
    onTimeUpFinalize,
    intl,
  ]);

  // Handle manual submit
  const handleSubmit = useCallback(async () => {
    if (!currentMock || !currentSubmissionId) {
      console.warn(
        "[TaskQuestionRunner] handleSubmit aborted: missing mock or submissionId",
      );
      return;
    }
    if (submitLockRef.current || isSubmitting) {
      return;
    }
    submitLockRef.current = true;

    if (!hasAnswers()) {
      toast.error(
        intl.formatMessage({
          id: "At least one answer required",
          defaultMessage:
            "Please answer at least one question before submitting.",
        }),
      );
      submitLockRef.current = false;
      return;
    }

    const answersObj = buildAnswersObject(currentMock);
    console.log(answersObj);
    const result = await submitFn(answersObj, { force: false });

    if (result && result.success) {
      toast.success(
        intl.formatMessage({
          id: "Submitted successfully",
          defaultMessage: "Submitted successfully!",
        }),
      );
      onFinalize?.();
    } else {
      console.error(
        "[TaskQuestionRunner] Submission failed or success not detected:",
        result,
      );
    }
    submitLockRef.current = false;
  }, [
    currentMock,
    currentSubmissionId,
    buildAnswersObject,
    submitFn,
    onFinalize,
    intl,
    hasAnswers,
    isSubmitting,
  ]);

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
      <div className="bg-white border-b px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 line-clamp-1">{title}</h2>
          <p className="text-xs text-gray-500 line-clamp-1">{parentTitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {durationMinutes && durationMinutes > 0 && (
            <div className="shrink-0">
              <ExamTimer duration={durationMinutes} onTimeUp={handleTimeUp} />
            </div>
          )}
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-gray-100 rounded transition-colors shrink-0"
            title={intl.formatMessage({
              id: "Toggle Fullscreen",
              defaultMessage: "Toggle Fullscreen",
            })}
          >
            <Maximize size={18} />
          </button>
          {mode === "homework" && autoSaveConfig?.onAutoSave && (
            <button
              onClick={handleSaveAndExit}
              disabled={isSubmitting || autoSaveConfig.isSaving}
              className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {autoSaveConfig.isSaving
                ? intl.formatMessage({
                    id: "Saving...",
                    defaultMessage: "Saving...",
                  })
                : intl.formatMessage({
                    id: "Save and Exit",
                    defaultMessage: "Save and Exit",
                  })}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-main text-white font-medium rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? intl.formatMessage({
                  id: "Submitting...",
                  defaultMessage: "Submitting...",
                })
              : mode === "homework"
                ? intl.formatMessage({
                    id: "Submit and Exit",
                    defaultMessage: "Submit and Exit",
                  })
                : intl.formatMessage({
                    id: "Submit Section",
                    defaultMessage: "Submit Section",
                  })}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <div
          className={`p-4 md:p-8 mx-auto min-h-full ${
            partSummaries.length > 0 ? "pb-32" : ""
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
