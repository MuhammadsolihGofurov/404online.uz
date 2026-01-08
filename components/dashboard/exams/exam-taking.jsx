import React, { useState, useEffect, useCallback } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { SECTION_TYPES } from "@/utils/examConstants";
import { parseDurationToMinutes } from "@/utils/durationParser";
import {
  getSectionConfig,
  getMockIdForSection,
  getMockTypeString,
  getSectionTitle,
} from "@/utils/sectionConfig";
import { useExamSubmission } from "@/hooks/useExamSubmission";
import { useLazyMocks } from "@/hooks/useLazyMocks";
import { useQuestionSession } from "@/hooks/useQuestionSession";
import ExamTimer from "./exam-timer";
import ExamSectionCard from "./exam-section-card";
import ExamQuestion from "./exam-question";
import ListeningFooter from "./listening-footer";
import { AlertCircle, Loader, Maximize } from "lucide-react";
import { toast } from "react-toastify";

export default function ExamTaking({ loading, taskType, taskId }) {
  const router = useRouter();
  const intl = useIntl();

  // Use taskId if provided (from generic task page), otherwise use id from router
  const examId = taskId || router.query.id;
  const type = taskType || "exams"; // Default to exams

  // State
  // State
  const [examStarted, setExamStarted] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom hooks (must be before useLazyMocks)
  const {
    currentSubmissionId,
    setCurrentSubmissionId,
    examResultId,
    sectionSubmissions,
    setSectionSubmissions,
    startError,
    setStartError,
    startSection,
  } = useExamSubmission(examId, intl);

  // Block Ctrl+R and F5 refresh with confirmation if in an active section
  useEffect(() => {
    // Handler for keyboard-based refresh (F5, Ctrl+R, Cmd+R)
    const handleKeyDown = (e) => {
      if (selectedSection && !isSubmitting) {
        // F5
        if (e.key === "F5") {
          e.preventDefault();
        }
        // Ctrl+R or Cmd+R
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
          e.preventDefault();
        }
      }
    };

    // Handler for all forms of refresh/navigation away
    const handleBeforeUnload = (e) => {
      if (selectedSection && !isSubmitting) {
        const message = intl.formatMessage({
          id: "refresh.confirm",
          defaultMessage:
            "Are you sure you want to leave or refresh? Your progress may be lost.",
        });
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedSection, isSubmitting, intl]);

  const {
    fetchMock,
    getMock,
    isLoading: isMockLoading,
    setMockForSection,
    mockData,
  } = useLazyMocks(router.locale, intl, setStartError);

  // Shared Question Session Hook
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
  } = useQuestionSession({
    getMock,
    getSectionConfig,
    sectionType: selectedSection,
  });

  // Fullscreen handler managed by useQuestionSession

  // Fetch exam/task details based on type
  const {
    data: exam,
    isLoading: examLoading,
    error: examError,
  } = useSWR(
    examId ? [`/tasks/${type}/${examId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Initialize section submissions from exam.my_submissions on load
  useEffect(() => {
    if (exam?.my_submissions) {
      const initialSubmissions = {};
      Object.entries(exam.my_submissions).forEach(([section, data]) => {
        if (data?.status) {
          initialSubmissions[section] = {
            status: data.status,
          };
        }
      });
      if (Object.keys(initialSubmissions).length > 0) {
        setSectionSubmissions((prev) => ({ ...prev, ...initialSubmissions }));
      }
    }
  }, [exam?.my_submissions, setSectionSubmissions]);

  // Force submit section if time runs out
  const handleTimeUp = useCallback(async () => {
    if (selectedSection && currentSubmissionId) {
      await submitSection({ force: true });
    }
    handleSubmitExam();
  }, [
    currentSubmissionId,
    selectedSection,
    examResultId,
    examId,
    type,
    router,
  ]);

  // Answer change handler is now managed by useQuestionSession


  // Navigation handlers are now managed by useQuestionSession


  const handleSectionChange = async (section) => {
    // If switching from another section, submit it first
    if (selectedSection && selectedSection !== section && currentSubmissionId) {
      setIsSubmitting(true);
      const success = await submitSection();
      setIsSubmitting(false);

      if (!success) {
        return;
      }
    }

    // Get mock details
    const mockId = getMockIdForSection(exam, section);
    if (!mockId) return;

    try {
      const response = await startSection(section, mockId);
      const failedToStart = !response || response.error;
      if (failedToStart) {
        const message =
          response?.message ||
          startError ||
          intl.formatMessage({
            id: "Failed to start section",
            defaultMessage: "Failed to start section",
          });
        toast.error(message);
        setStartError(message);
        return;
      }

      // If API returns the mock, store it immediately
      const mockType = getMockTypeString(section);
      const embeddedMock = response[`${mockType}_mock`] || response.mock;
      if (embeddedMock) {
        setMockForSection(section, embeddedMock);
      } else if (!getMock(section)) {
        // Fallback: fetch mock if not provided in response and not already cached
        await fetchMock(section, mockId);
      }

      // Only after successful start, move into the section
      setSelectedSection(section);
      resetSession();
      setExamStarted(true);
    } catch (error) {
      const message =
        error?.message ||
        intl.formatMessage({
          id: "Failed to start section",
          defaultMessage: "Failed to start section",
        });
      toast.error(message);
      setStartError(message);
    }
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
  };

  // Accepts options: { force: boolean }
  const submitSection = async (options = {}) => {
    if (!currentSubmissionId) {
      setStartError(
        intl.formatMessage({
          id: "No active submission",
          defaultMessage: "No active submission found",
        })
      );
      return false;
    }

    setIsSubmitting(true);
    try {
      const currentMock = getMock(selectedSection);
      const answersObject = buildAnswersObject(currentMock);


      // Guard: require at least one answer for submission, unless force is set (e.g. time up)
      const hasAtLeastOneAnswer = Object.values(answersObject).some(
        (val) => val && String(val).trim() !== ""
      );
      if (!hasAtLeastOneAnswer && !options.force) {
        toast.error(
          intl.formatMessage({
            id: "At least one answer required",
            defaultMessage:
              "Please answer at least one question before submitting.",
          })
        );
        setIsSubmitting(false);
        return false;
      }

      const response = await fetcher(
        `/submissions/${currentSubmissionId}/submit/`,
        {
          method: "PATCH",
          body: JSON.stringify({ answers: answersObject }),
        },
        {},
        true
      );

      if (response) {
        setSectionSubmissions((prev) => ({
          ...prev,
          [selectedSection]: {
            id: currentSubmissionId,
            status: response.status,
            band_score: response.band_score,
          },
        }));
        setCurrentSubmissionId(null);
        return true;
      }
    } catch (error) {
      setStartError(
        error?.message ||
          intl.formatMessage({
            id: "Failed to submit section",
            defaultMessage: "Failed to submit section",
          })
      );
      console.error("Error submitting section:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSectionComplete = async () => {
    const success = await submitSection();
    if (success) {
      // Return to section selection
      setSelectedSection(null);
      setCurrentSubmissionId(null);
      setExamStarted(false);
    }
  };

  const handleSubmitExam = async () => {
    // If currently in a section, submit it first
    if (selectedSection && currentSubmissionId) {
      await submitSection();
    }

    // Navigate to dashboard list page
    router.push(`/dashboard/${type}`);
  };

  const getMockForSection = (section) => getMock(section);

  const getLoadingForSection = (section) => isMockLoading(section);

  // Part handlers and getTotalQuestionsCount are now managed by useQuestionSession


  const getStatusForSection = (section) => {
    const submission = sectionSubmissions[section];
    if (!submission) return "NOT_STARTED";
    return submission.status || "IN_PROGRESS";
  };

  const isLoading =
    loading ||
    examLoading ||
    (selectedSection && getLoadingForSection(selectedSection));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {intl.formatMessage({
              id: "Loading exam",
              defaultMessage: "Loading exam...",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (examError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">
                {intl.formatMessage({
                  id: "Error loading exam",
                  defaultMessage: "Error loading exam",
                })}
              </h3>
              <p className="text-red-700 text-sm mb-4">{examError?.message}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {intl.formatMessage({
                  id: "Go Back",
                  defaultMessage: "Go Back",
                })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const examDurationMinutes = parseDurationToMinutes(exam?.duration) ?? 180;

  // Get duration from exam-level fields first, fallback to mock, then exam duration
  const getLibraryDuration = (section) => {
    const config = getSectionConfig(section);
    const durationKey = config.mockKey.replace("_mock", "_mock_duration");
    const examLevelDuration = exam?.[durationKey];
    if (examLevelDuration) {
      return parseDurationToMinutes(examLevelDuration) ?? examDurationMinutes;
    }
    return (
      parseDurationToMinutes(getMock(section)?.duration) ?? examDurationMinutes
    );
  };

  // Get title from exam object first (new API), fallback to mock title
  const getExamSectionTitle = (section) => {
    const config = getSectionConfig(section);
    const titleKey = config.mockKey.replace("_mock", "_mock_title");
    return exam?.[titleKey] || getSectionTitle(exam, section);
  };

  const isSubmitted = (section) => {
    const status = sectionSubmissions[section]?.status;
    return status === "GRADED" || status === "SUBMITTED";
  };

  // Show section selection cards
  if (!selectedSection) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {startError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm">
            {startError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex items-center justify-center pt-24">
          <div className="w-full max-w-6xl px-6 py-40 sm:pt-0">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              {exam.title}
            </h1>
            <p className="text-gray-600 mb-12">{exam.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                SECTION_TYPES.LISTENING,
                SECTION_TYPES.READING,
                SECTION_TYPES.WRITING,
              ].map((section) => {
                const mockId = getMockIdForSection(exam, section);
                if (!mockId) return null;

                return (
                  <ExamSectionCard
                    key={section}
                    title={getExamSectionTitle(section)}
                    duration={getLibraryDuration(section)}
                    status={getStatusForSection(section)}
                    onClick={() => handleSectionChange(section)}
                    isLoading={getLoadingForSection(section)}
                    isCompleted={isSubmitted(section)}
                    bandScore={sectionSubmissions[section]?.band_score}
                  />
                );
              })}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting
                  ? intl.formatMessage({
                      id: "Submitting...",
                      defaultMessage: "Submitting...",
                    })
                  : intl.formatMessage({
                      id: "Go to Dashboard",
                      defaultMessage: "Go to Dashboard",
                    })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show question view for selected section
  const currentMock = getMockForSection(selectedSection);

  if (!currentMock) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Mock data not loaded</p>
          <button
            onClick={handleBackToSections}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 overflow-auto flex flex-col">
      {/* Custom Header with Title, Timer, and Fullscreen Button */}
      {examStarted && selectedSection && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex justify-between">
            <div className="text-center leading-tight">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedSection === SECTION_TYPES.LISTENING && "Listening"}
                {selectedSection === SECTION_TYPES.READING && "Reading"}
                {selectedSection === SECTION_TYPES.WRITING && "Writing"}
              </h2>
              <p className="text-xs text-gray-500">
                {intl.formatMessage({
                  id: "Section",
                  defaultMessage: "Section",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSectionComplete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                {isSubmitting
                  ? intl.formatMessage({
                      id: "Submitting...",
                      defaultMessage: "Submitting...",
                    })
                  : intl.formatMessage({
                      id: "Submit Section",
                      defaultMessage: "Submit Section",
                    })}
              </button>
              <ExamTimer
                duration={getLibraryDuration(selectedSection)}
                onTimeUp={handleTimeUp}
              />
            </div>
            <button
              onClick={handleFullscreen}
              className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title={intl.formatMessage({
                id: "Toggle Fullscreen",
                defaultMessage: "Toggle Fullscreen",
              })}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      )}

      {startError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm">
          {startError}
        </div>
      )}

      <div className={`flex-1 flex flex-col px-3 md:px-6 pb-48`}>
        <ExamQuestion
          mock={currentMock}
          sectionType={selectedSection}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          onSelectQuestion={handleSelectQuestion}
          onBackToSections={handleBackToSections}
          onPartSummariesChange={handlePartSummariesChange}
          onPartChange={handlePartChangeFromFooter}
          isPractice={type === "mocks"}
          activePartIndex={activePartIndex}
          focusQuestionNumber={focusQuestionNumber}
        />
      </div>

      {/* Part Switcher Footer - for Listening/Reading/Writing */}
      {examStarted &&
        (selectedSection === SECTION_TYPES.LISTENING ||
          selectedSection === SECTION_TYPES.READING ||
          selectedSection === SECTION_TYPES.WRITING) &&
        partSummaries.length > 0 && (
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

      {/* Add padding when footer is visible to avoid overlap */}
      {examStarted &&
        (selectedSection === SECTION_TYPES.LISTENING ||
          selectedSection === SECTION_TYPES.READING ||
          selectedSection === SECTION_TYPES.WRITING) &&
        partSummaries.length > 0 && <div className="h-20" />}
    </div>
  );
}
