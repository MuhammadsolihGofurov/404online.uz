import React, { useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import TaskQuestionRunner from "@/components/dashboard/tasks/TaskQuestionRunner";
import { useLazyMocks } from "@/hooks/useLazyMocks";
import { SECTION_TYPES } from "@/utils/examConstants";
import fetcher from "@/utils/fetcher";
import { parseDurationToMinutes } from "@/utils/durationParser";
import { buildUserAnswersPayload } from "@/utils/submission-answers";
import ExamResultsReview from "@/components/custom/offcanvas/tasks-exams/exams-reading-results-offcanvas";

const SECTION_MAP = {
  listening: SECTION_TYPES.LISTENING,
  reading: SECTION_TYPES.READING,
};

const toMockType = (sectionType) => {
  if (sectionType === SECTION_TYPES.LISTENING) return "LISTENING";
  if (sectionType === SECTION_TYPES.READING) return "READING";
  return null;
};

export default function PracticeTaking({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { type, id } = router.query;
  const mockId = useMemo(
    () => (Array.isArray(id) ? id[0] : id),
    [id]
  );

  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("TAKING");
  const [resultSubmissionId, setResultSubmissionId] = useState(null);

  const sectionType = useMemo(
    () => SECTION_MAP[String(type || "").toLowerCase()],
    [type]
  );
  const contentType = useMemo(() => toMockType(sectionType), [sectionType]);

  const {
    fetchMock,
    getMock,
    isLoading: isMockLoading,
    setMockForSection,
  } = useLazyMocks(router.locale, intl, setStartError);

  const currentMock = getMock(sectionType, mockId);
  const durationMinutes = useMemo(
    () => parseDurationToMinutes(currentMock?.duration) ?? null,
    [currentMock]
  );

  const stableGetMock = useCallback(
    (section) => getMock(section, mockId),
    [getMock, mockId]
  );

  const handleExit = useCallback(() => {
    router.push("/dashboard/materials-hub?type=TRAINING_ZONE");
  }, [router]);

  const startPractice = useCallback(async () => {
    if (!mockId || !contentType) return null;
    setStartError(null);

    try {
      const response = await fetcher(
        "/submissions/start_practice/",
        {
          method: "POST",
          body: JSON.stringify({
            content_id: mockId,
            content_type: contentType,
          }),
        },
        {},
        true
      );

      const submissionId = response?.id || response?.submission_id || null;
      if (submissionId) {
        setCurrentSubmissionId(submissionId);
      }
      return response;
    } catch (error) {
      const errorMsg =
        error?.message ||
        intl.formatMessage({
          id: "Failed to start practice",
          defaultMessage: "Failed to start practice",
        });
      setStartError(errorMsg);
      return { error: true, message: errorMsg };
    }
  }, [mockId, contentType, intl]);

  const submitPractice = useCallback(
    async (answersObject) => {
      if (!currentSubmissionId) {
        return { success: false, message: "No active submission" };
      }

      setIsSubmitting(true);
      try {
        const response = await fetcher(
          `/submissions/${currentSubmissionId}/submit/`,
          {
            method: "PATCH",
            body: JSON.stringify({
              answers: answersObject,
              user_answers: buildUserAnswersPayload(answersObject),
            }),
          },
          {},
          true
        );

        if (response) {
          return { success: true };
        }
      } catch (error) {
        const errorMsg =
          error?.message ||
          intl.formatMessage({
            id: "Failed to submit practice",
            defaultMessage: "Failed to submit practice",
          });
        return { success: false, message: errorMsg };
      } finally {
        setIsSubmitting(false);
      }

      return { success: false, message: "Unknown error" };
    },
    [currentSubmissionId, intl]
  );

  const handleFinalize = useCallback(() => {
    if (currentSubmissionId) {
      setResultSubmissionId(currentSubmissionId);
    }
    setViewMode("RESULT");
  }, [currentSubmissionId]);

  if (loading || !router.isReady || !mockId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          {intl.formatMessage({
            id: "Loading practice",
            defaultMessage: "Loading practice...",
          })}
        </p>
      </div>
    );
  }

  if (!sectionType || !contentType) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">
            {intl.formatMessage({
              id: "Invalid practice type",
              defaultMessage: "Invalid practice type.",
            })}
          </p>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {intl.formatMessage({ id: "Go Back", defaultMessage: "Go Back" })}
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "RESULT" && resultSubmissionId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              {intl.formatMessage({
                id: "Back to Training Zone",
                defaultMessage: "Back to Training Zone",
              })}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ExamResultsReview submission_id={resultSubmissionId} />
        </div>
      </div>
    );
  }

  return (
    <TaskQuestionRunner
      mode="mock"
      title={
        currentMock?.title ||
        intl.formatMessage({
          id: "Practice Mock",
          defaultMessage: "Practice Mock",
        })
      }
      parentTitle={intl.formatMessage({
        id: "Training zone",
        defaultMessage: "Training zone",
      })}
      sectionType={sectionType}
      durationMinutes={durationMinutes}
      getMock={stableGetMock}
      fetchMock={fetchMock}
      setMockForSection={setMockForSection}
      mockId={mockId}
      currentSubmissionId={currentSubmissionId}
      startFn={startPractice}
      submitFn={submitPractice}
      onFinalize={handleFinalize}
      onExit={handleExit}
      isLoadingMock={isMockLoading(sectionType, mockId)}
      isSubmitting={isSubmitting}
      startError={startError}
      onStartError={setStartError}
    />
  );
}
