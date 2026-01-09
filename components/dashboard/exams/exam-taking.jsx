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
import ExamSectionCard from "./exam-section-card";
import TaskQuestionRunner from "@/components/dashboard/tasks/TaskQuestionRunner";
import { AlertCircle, Loader } from "lucide-react";
import { toast } from "react-toastify";

export default function ExamTaking({ loading, taskType, taskId }) {
  const router = useRouter();
  const intl = useIntl();

  // Use taskId if provided (from generic task page), otherwise use id from router
  const examId = taskId || router.query.id;
  const type = taskType || "exams"; // Default to exams

  // State
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

  const {
    fetchMock,
    getMock,
    isLoading: isMockLoading,
    setMockForSection,
    mockData,
  } = useLazyMocks(router.locale, intl, setStartError);

  // Fetch exam/task details based on type
  const {
    data: exam,
    isLoading: examLoading,
    error: examError,
  } = useSWR(
    router.isReady && examId ? [`/tasks/${type}/${examId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
    }
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
      console.log(`[ExamTaking] Starting section ${section} with mock ${mockId}...`);
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
        setMockForSection(section, embeddedMock, mockId);
      } else if (!getMock(section, mockId)) {
        // Fallback: fetch mock if not provided in response and not already cached
        await fetchMock(section, mockId);
      }

      // Only after successful start, move into the section
      setSelectedSection(section);
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
    setCurrentSubmissionId(null);
  };

  // Wrapper function for TaskQuestionRunner's submitFn
  const submitSectionFn = useCallback(
    async (answersObject, options = {}) => {
      if (!currentSubmissionId) {
        setStartError(
          intl.formatMessage({
            id: "No active submission",
            defaultMessage: "No active submission found",
          })
        );
        return { success: false, message: "No active submission" };
      }

      setIsSubmitting(true);
      try {
        // Guard: require at least one answer for submission, unless force is set (e.g. time up)
        const hasAtLeastOneAnswer = Object.values(answersObject).some(
          (val) => val && String(val).trim() !== ""
        );
        if (!hasAtLeastOneAnswer && !options.force) {
          setIsSubmitting(false);
          return { success: false, message: "No answers provided" };
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
          console.log("TaskQuestionRunner submission successful:", response);
          toast.success(
            intl.formatMessage({
              id: "Submitted successfully",
              defaultMessage: "Submitted successfully!",
            })
          );
          return { success: true };
        }
      } catch (error) {
        const errorMsg = error?.message ||
          intl.formatMessage({
            id: "Failed to submit section",
            defaultMessage: "Failed to submit section",
          });
        setStartError(errorMsg);
        console.error("TaskQuestionRunner submission failed:", error);
        return { success: false, message: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
      return { success: false, message: "Unknown error" };
    },
    [currentSubmissionId, selectedSection, intl, setSectionSubmissions, setStartError]
  );

  // Wrapper function for TaskQuestionRunner's startFn
  const startSectionFn = useCallback(
    async () => {
      if (!selectedSection) return null;
      const mockId = getMockIdForSection(exam, selectedSection);
      if (!mockId) return null;

      const response = await startSection(selectedSection, mockId);
      if (response && !response.error) {
        // If API returns the mock, store it immediately
        const mockType = getMockTypeString(selectedSection);
        const embeddedMock = response[`${mockType}_mock`] || response.mock;
        if (embeddedMock) {
          setMockForSection(selectedSection, embeddedMock, mockId);
        } else if (!getMock(selectedSection, mockId)) {
          // Fallback: fetch mock if not provided in response and not already cached
          await fetchMock(selectedSection, mockId);
        }
        return response;
      }
      return response;
    },
    [selectedSection, exam, startSection, getMock, fetchMock, setMockForSection]
  );

  const currentMockId = selectedSection ? getMockIdForSection(exam, selectedSection) : null;

  const stableGetMock = useCallback(
    (section) => getMock(section, currentMockId),
    [getMock, currentMockId]
  );
  const handleSectionComplete = () => {
    // Return to section selection after manual submit
    setSelectedSection(null);
    setCurrentSubmissionId(null);
  };

  const handleTimeUpFinalize = () => {
    // On time up, submit exam and go to dashboard
    handleSubmitExam();
  };

  // Helper to submit current section from parent state (usually with force/empty if we don't have answers here)
  const submitSection = async () => {
    if (!currentSubmissionId) return true;
    const result = await submitSectionFn({}, { force: true });
    return result?.success;
  };

  const handleSubmitExam = async () => {
    // If currently in a section, submit it first
    if (selectedSection && currentSubmissionId) {
      await submitSection();
    }

    // Navigate to dashboard list page
    router.push(`/dashboard/${type}`);
  };

  const getLoadingForSection = (section) => isMockLoading(section, getMockIdForSection(exam, section));

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
      parseDurationToMinutes(getMock(section, getMockIdForSection(exam, section))?.duration) ?? examDurationMinutes
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
            <div
              className="text-gray-600 mb-12 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: exam.description }}
            />

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

  // Show question view for selected section using TaskQuestionRunner
  if (selectedSection) {
    const mockId = getMockIdForSection(exam, selectedSection);
    return (
      <TaskQuestionRunner
        mode="exam"
        title={getExamSectionTitle(selectedSection)}
        parentTitle={exam.title}
        sectionType={selectedSection}
        durationMinutes={getLibraryDuration(selectedSection)}
        getMock={stableGetMock}
        fetchMock={fetchMock}
        mockId={mockId}
        currentSubmissionId={currentSubmissionId}
        startFn={startSectionFn}
        submitFn={submitSectionFn}
        onFinalize={handleSectionComplete}
        onTimeUpFinalize={handleTimeUpFinalize}
        onExit={handleBackToSections}
        isLoadingMock={isMockLoading(selectedSection, mockId)}
        isSubmitting={isSubmitting}
        startError={startError}
        onStartError={setStartError}
      />
    );
  }

  return null;
}
