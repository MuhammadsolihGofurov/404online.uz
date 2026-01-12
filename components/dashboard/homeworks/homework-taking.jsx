import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { SECTION_TYPES } from "@/utils/examConstants";
import { parseDurationToMinutes } from "@/utils/durationParser";
import { useHomeworkSubmission } from "@/hooks/useHomeworkSubmission";
import { useLazyMocks } from "@/hooks/useLazyMocks";
import TaskQuestionRunner from "@/components/dashboard/tasks/TaskQuestionRunner";
import QuizRunner from "@/components/dashboard/tasks/QuizRunner";
import {
  Loader,
  CheckCircle,
  PlayCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import { toast } from "react-toastify";

/**
 * Map content_type from homework items to SECTION_TYPES
 */
const mapContentTypeToSection = (contentType) => {
  if (!contentType) return null;
  const normalizedType = contentType.toUpperCase();
  const typeMap = {
    LISTENING: SECTION_TYPES.LISTENING,
    READING: SECTION_TYPES.READING,
    WRITING: SECTION_TYPES.WRITING,
    QUIZ: SECTION_TYPES.QUIZ,
    LISTENING_MOCK: SECTION_TYPES.LISTENING,
    READING_MOCK: SECTION_TYPES.READING,
    WRITING_MOCK: SECTION_TYPES.WRITING,
    QUIZ_MOCK: SECTION_TYPES.QUIZ,
  };
  return typeMap[normalizedType] || null;
};

const hasQuestionIds = (mock) => {
  if (!mock) return false;

  const isUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
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

  if (Array.isArray(mock.parts)) return mock.parts.some(containerHasIds);
  if (Array.isArray(mock.passages)) return mock.passages.some(containerHasIds);
  if (Array.isArray(mock.question_groups)) {
    return mock.question_groups.some(groupHasIds);
  }
  return false;
};

const shouldReplaceMock = (existingMock, nextMock, sectionType) => {
  if (!nextMock) return false;
  if (!existingMock) return true;
  if (
    sectionType === SECTION_TYPES.WRITING ||
    sectionType === SECTION_TYPES.QUIZ
  ) {
    return true;
  }
  const existingHasIds = hasQuestionIds(existingMock);
  const nextHasIds = hasQuestionIds(nextMock);
  if (existingHasIds && !nextHasIds) return false;
  if (!existingHasIds && nextHasIds) return true;
  return false;
};

const HomeworkTaking = ({ loading: pageLoading }) => {
  const router = useRouter();
  const intl = useIntl();
  const { id: homeworkId } = router.query;

  // --- STATE ---
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'TAKING'
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  // Refs
  const loadedItemRef = useRef(null);
  const startedItemRef = useRef(null);

  // --- DATA FETCHING ---
  const {
    data: homework,
    isLoading: homeworkLoading,
    error: homeworkError,
    mutate: mutateHomework
  } = useSWR(
    homeworkId ? [`/tasks/homeworks/${homeworkId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  const items = useMemo(() => {
    return homework?.items || homework?.homework_items || [];
  }, [homework]);

  const getLatestSubmission = (item) => {
    const submissions = item?.submissions;
    if (!Array.isArray(submissions) || submissions.length === 0) return null;
    return submissions[submissions.length - 1];
  };

  // Derived based on currentItemIndex
  const currentItem = currentItemIndex !== null ? items[currentItemIndex] : null;
  const currentSectionType = useMemo(() =>
    currentItem ? mapContentTypeToSection(currentItem.content_type) : null,
    [currentItem]);

  const currentMockId = useMemo(() => {
    if (!currentItem) return null;
    // Prefer explict mock_id if available (though it seems missing in API), 
    // otherwise check typed fields
    return currentItem.mock_id ||
      currentItem.listening_mock ||
      currentItem.reading_mock ||
      currentItem.writing_mock ||
      currentItem.quiz_mock ||
      currentItem.quiz ||
      currentItem.content_id;
  }, [currentItem]);

  const homeworkDurationMinutes = useMemo(() =>
    parseDurationToMinutes(homework?.duration) ?? null,
    [homework]);


  // --- HOOKS ---
  const {
    currentSubmissionId,
    setCurrentSubmissionId,
    itemSubmissions,
    setItemSubmissions,
    startError,
    setStartError,
    isSubmitting,
    isSavingDraft,
    startItem,
    submitItem,
    submitHomework,
    saveDraft,
  } = useHomeworkSubmission(homeworkId, intl);

  const {
    fetchMock,
    getMock,
    isLoading: isMockLoading,
    isFailed: isMockFailed,
    setMockForSection,
  } = useLazyMocks(router.locale, intl, setStartError);

  // Fix: Move stableGetMock to top level to avoid Hook Violation
  const stableGetMock = useCallback(
    (section) => getMock(section, currentMockId),
    [getMock, currentMockId]
  );


  // --- EFFECTS ---

  // 1. Initialize submissions
  useEffect(() => {
    if (homework?.my_submissions) {
      const initialSubmissions = {};
      Object.entries(homework.my_submissions).forEach(([itemId, data]) => {
        if (data?.status) {
          initialSubmissions[itemId] = { status: data.status, score: data.score };
        }
      });
      if (Object.keys(initialSubmissions).length > 0) {
        setItemSubmissions((prev) => ({ ...prev, ...initialSubmissions }));
      }
    }
  }, [homework?.my_submissions, setItemSubmissions]);

  // --- ACTIONS ---

  const handleStartItem = (index) => {
    const item = items[index];
    // Force a fresh start call; startItem handles in-progress resumes.
    setCurrentSubmissionId(null);
    setStartError(null);

    setCurrentItemIndex(index);
    setViewMode('TAKING');
    loadedItemRef.current = null;
    startedItemRef.current = null;
  };

  const handleReturnToList = () => {
    setViewMode('LIST');
    setCurrentItemIndex(null);
    setCurrentSubmissionId(null);
    loadedItemRef.current = null;
    startedItemRef.current = null;
    mutateHomework(); // Refresh statuses
  };

  // Wrapper function for TaskQuestionRunner's startFn
  const startItemFn = useCallback(async () => {
    if (!currentItem || !currentSectionType) {
      console.warn("[HomeworkTaking] startItemFn aborted: missing currentItem or type");
      return null;
    }

    const itemKey = `${currentItem.id}`;
    // Don't restart if already started this session
    if (startedItemRef.current === itemKey) {
      return { id: currentSubmissionId, resumed: true };
    }

    const existingStatus =
      itemSubmissions[currentItem.id]?.status ||
      getLatestSubmission(currentItem)?.status;
    if (existingStatus === 'SUBMITTED' || existingStatus === 'GRADED') {
      return null;
    }

    try {
      const response = await startItem(currentItem.id, currentMockId, currentItem.content_type);
      if (response && !response.error) {
        startedItemRef.current = itemKey;
        const mockKey = `${currentItem.id}-${currentSectionType}`;
        loadedItemRef.current = mockKey;
        const embeddedMock =
          response?.listening_mock ||
          response?.reading_mock ||
          response?.writing_mock ||
          response?.quiz_mock ||
          response?.mock ||
          response?.content ||
          null;
        if (embeddedMock && currentMockId) {
          const existingMock = getMock(currentSectionType, currentMockId);
          if (shouldReplaceMock(existingMock, embeddedMock, currentSectionType)) {
            setMockForSection(currentSectionType, embeddedMock, currentMockId);
          }
        }
        const submissionId = response?.id || response?.submission_id;
        if (submissionId && currentMockId) {
          try {
            const submissionData = await fetcher(
              `/submissions/${submissionId}/`,
              {
                headers: { "Accept-Language": router.locale },
              },
              {},
              true
            );
            const submissionMock =
              submissionData?.mock ||
              submissionData?.content ||
              submissionData?.listening_mock ||
              submissionData?.reading_mock ||
              submissionData?.writing_mock ||
              submissionData?.quiz_mock ||
              null;
            if (submissionMock) {
              const existingMock = getMock(currentSectionType, currentMockId);
              if (shouldReplaceMock(existingMock, submissionMock, currentSectionType)) {
                setMockForSection(currentSectionType, submissionMock, currentMockId);
              }
            }
          } catch (error) {
            console.warn("[HomeworkTaking] Failed to hydrate mock from submission:", error);
          }
        }
      }
      return response;
    } catch (err) {
      console.error("[HomeworkTaking] Failed to start item:", err);
      return { error: true, message: err?.message };
    }
  }, [
    currentItem,
    currentSectionType,
    currentSubmissionId,
    itemSubmissions,
    startItem,
    currentMockId,
    getMock,
    setMockForSection,
    router.locale,
  ]);

  // Wrapper function for TaskQuestionRunner's submitFn
  const submitItemFn = useCallback(async (answersObject, options = {}) => {
    if (!currentItem) return false;
    const result = await submitItem(currentItem.id, answersObject, options);
    return result;
  }, [currentItem, submitItem]);

  // Wrapper function for TaskQuestionRunner's autoSave
  const handleAutoSave = useCallback(async (answersObject) => {
    if (!currentItem || !currentSubmissionId) return false;
    return saveDraft(currentItem.id, answersObject);
  }, [currentItem, currentSubmissionId, saveDraft]);

  // --- RENDER ---

  if (pageLoading || homeworkLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader className="animate-spin text-blue-600" /></div>;
  }

  if (homeworkError || !homework) {
    return <div className="h-screen flex items-center justify-center"><p className="text-red-500">Error loading homework</p></div>;
  }

  // --- VIEW: LIST MODE ---
  if (viewMode === 'LIST') {
    return (
      <div className="bg-gray-50 flex flex-col max-h-full overflow-y-auto">
        <div className="max-w-4xl min-h-screen mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
          <div className="mb-8 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => router.push("/dashboard/homeworks")} className="flex items-center text-gray-500 mb-6 hover:text-gray-900 transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              {intl.formatMessage({ id: "Back to Homeworks", defaultMessage: "Back to Homeworks" })}
            </button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{homework.title}</h1>
                {homework.description && (
                  <div
                    className="text-gray-600 max-w-2xl prose prose-sm break-words"
                    dangerouslySetInnerHTML={{ __html: homework.description }}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {homework.deadline && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <Clock size={16} className="mr-2" />
                    <span className="font-medium">
                      {intl.formatMessage({ id: "Deadline", defaultMessage: "Deadline" })}: {" "}
                      {new Date(homework.deadline).toLocaleString(router.locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 px-1">
                  <span>{items.length} {intl.formatMessage({ id: "tasks", defaultMessage: "tasks" })}</span>
                  <span className="hidden sm:inline mx-2">•</span>
                  <span>
                    {intl.formatMessage({ id: "Created by", defaultMessage: "Created by" })} {homework.created_by_name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid - Exam Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item, idx) => {
              const latestSubmission = getLatestSubmission(item);
              const status =
                itemSubmissions[item.id]?.status ||
                latestSubmission?.status ||
                'NOT_STARTED';
              const isCompleted = status === 'SUBMITTED' || status === 'GRADED';

              // Map status to styling (similar to ExamSectionCard)
              const statusConfig = {
                NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-800", label: intl.formatMessage({ id: "Not Started", defaultMessage: "Not Started" }) },
                STARTED: { bg: "bg-yellow-100", text: "text-yellow-800", label: intl.formatMessage({ id: "In Progress", defaultMessage: "In Progress" }) },
                SAVED: { bg: "bg-yellow-100", text: "text-yellow-800", label: intl.formatMessage({ id: "Saved", defaultMessage: "Saved" }) },
                IN_PROGRESS: { bg: "bg-yellow-100", text: "text-yellow-800", label: intl.formatMessage({ id: "In Progress", defaultMessage: "In Progress" }) },
                SUBMITTED: { bg: "bg-blue-100", text: "text-blue-800", label: intl.formatMessage({ id: "Submitted", defaultMessage: "Submitted" }) },
                GRADED: { bg: "bg-green-100", text: "text-green-800", label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }) },
              };
              const style = statusConfig[status] || statusConfig.NOT_STARTED;

              return (
                <button
                  key={item.id}
                  onClick={() => handleStartItem(idx)}
                  disabled={isCompleted}
                  className={`group relative bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-left flex flex-col items-start h-full
                        ${isCompleted ? 'opacity-75' : ''}
                      `}
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>

                    {item.content_type && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${item.content_type === 'LISTENING' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        item.content_type === 'READING' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          item.content_type === 'WRITING' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                        {item.content_type}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2" title={item.content_title || item.title}>
                    {item.content_title || item.title || `Task ${idx + 1}`}
                  </h3>

                  <div className="mt-auto pt-4 w-full flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bg} ${style.text}`}>
                      {(status === 'GRADED' || status === 'SUBMITTED') && <CheckCircle className="w-4 h-4" />}
                      <span className="text-sm font-semibold">{style.label}</span>
                    </div>

                    {!isCompleted && (
                      <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                        <PlayCircle size={24} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: TAKING MODE ---
  if (viewMode === 'TAKING' && currentItem && currentSectionType) {
    if (currentSectionType === SECTION_TYPES.QUIZ) {
      return (
        <QuizRunner
          title={currentItem.title || currentItem.content_title}
          mockId={currentMockId}
          quizData={getMock(currentSectionType, currentMockId)}
          currentSubmissionId={currentSubmissionId}
          startFn={startItemFn}
          submitFn={submitItemFn}
          onFinalize={handleReturnToList}
          onExit={handleReturnToList}
          autoSaveConfig={{
            onAutoSave: handleAutoSave,
            isSaving: isSavingDraft,
          }}
          fetchMock={fetchMock}
          sectionType={currentSectionType}
          isLoadingMock={isMockLoading(currentSectionType, currentMockId)}
          isFailed={isMockFailed(currentSectionType, currentMockId)}
          isSubmitting={isSubmitting}
          startError={startError}
        />
      );
    }
    return (
      <TaskQuestionRunner
        mode="homework"
        title={currentItem.content_title || currentItem.title || `Task ${currentItemIndex + 1}`}
        parentTitle={homework.title}
        sectionType={currentSectionType}
        durationMinutes={homeworkDurationMinutes}
        getMock={stableGetMock}
        fetchMock={fetchMock}
        setMockForSection={setMockForSection}
        mockId={currentMockId}
        currentSubmissionId={currentSubmissionId}
        startFn={startItemFn}
        submitFn={submitItemFn}
        onFinalize={handleReturnToList}
        onExit={handleReturnToList}
        autoSaveConfig={{
          onAutoSave: handleAutoSave,
          isSaving: isSavingDraft,
        }}
        isLoadingMock={isMockLoading(currentSectionType, currentMockId)}
        isSubmitting={isSubmitting}
        startError={startError}
        onStartError={setStartError}
      />
    );
  }

  return null;
};

export default HomeworkTaking;
