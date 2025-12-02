import { withAuthGuard } from "@/components/guard/dashboard-guard";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { authAxios } from "@/utils/axios";
import { useState, useEffect, useMemo } from "react";
import { ExamRoomLayout } from "@/components/exam/exam-room-layout";
import { ExamDataNormalizer } from "@/components/exam/exam-data-normalizer";
import { TaskCompletionModal } from "@/components/exam/task-completion-modal";
import { WaitingRoom } from "@/components/exam/WaitingRoom";
import { QuizRunner } from "@/components/exam/QuizRunner";

function ExamRoomPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { id, mode } = router.query;
  const [normalizedData, setNormalizedData] = useState(null);
  const [existingDraft, setExistingDraft] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedSubmission, setCompletedSubmission] = useState(null);
  
  // New State for flow control
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [isExamStarted, setIsExamStarted] = useState(false);

  const isPracticeMode = mode === 'practice';

  // Fetch task details
  const { data: task, isLoading: taskLoading, error: taskError } = useSWR(
    id ? ["/tasks/", router.locale, id] : null,
    async ([url, locale]) => {
      const taskData = await fetcher(
        `${url}${id}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      );

      // If task has mocks (not QUIZ), fetch full mock details with sections and questions
      if (taskData && taskData.task_type !== "QUIZ" && taskData.mocks && taskData.mocks.length > 0) {
        const mockIds = taskData.mocks;
        const mockDetails = await Promise.all(
          mockIds.map((mockId) =>
            fetcher(
              `/mocks/${mockId}/`,
              {
                headers: {
                  "Accept-Language": locale,
                },
              },
              {},
              true
            ).catch((err) => {
              console.error(`Error fetching mock ${mockId}:`, err);
              return null;
            })
          )
        );

        // Replace mock IDs with full mock objects
        taskData.mocks = mockDetails.filter(Boolean);
      }

      return taskData;
    }
  );

  // Fetch existing draft submission (skip in practice mode)
  const { data: draftData, mutate: mutateDraft } = useSWR(
    id && user?.id && !isPracticeMode ? ["/submissions/", router.locale, id, user.id] : null,
    async ([url, locale]) => {
      try {
        const response = await authAxios.get(`${url}?task=${id}&status=DRAFT`);
        const submissions = response.data?.results || response.data || [];
        // Find draft for this task
        return submissions.find((sub) => sub.status === "DRAFT") || null;
      } catch (error) {
        console.error("Error fetching draft:", error);
        return null;
      }
    }
  );

  // Check eligibility for EXAM_MOCK
  useEffect(() => {
    if (task && task.task_type === 'EXAM_MOCK' && !isPracticeMode) {
      const checkEligibility = async () => {
        try {
          const response = await authAxios.get(`/tasks/${task.id}/check-submission-eligibility/`);
          setEligibility(response.data);
          
          // If eligible, mark as started immediately
          if (response.data?.can_submit) {
            setIsExamStarted(true);
          }
        } catch (error) {
          console.error("Error checking eligibility:", error);
          setEligibility({ can_submit: false, reason: "Error checking status" });
        } finally {
          setCheckingEligibility(false);
        }
      };
      
      checkEligibility();
    } else {
      // For other types, logic is simple
      setCheckingEligibility(false);
      setIsExamStarted(true); 
    }
  }, [task, isPracticeMode]);

  // Normalize data when task is loaded
  useEffect(() => {
    if (task) {
      const normalized = ExamDataNormalizer.normalize(task);
      setNormalizedData(normalized);
    }
  }, [task]);

  // Set existing draft when loaded
  useEffect(() => {
    if (draftData) {
      setExistingDraft(draftData);
    }
  }, [draftData]);

  // Handle submission completion (for non-EXAM tasks)
  const handleSubmissionComplete = (submission) => {
    setCompletedSubmission(submission);
    setShowCompletionModal(true);
  };

  // Handle retry (replay workflow)
  const handleRetry = () => {
    setShowCompletionModal(false);
    setCompletedSubmission(null);
    setExistingDraft(null);
    // Reload page to start fresh (backend will create new submission)
    router.reload();
  };

  // Handle exit to dashboard
  const handleExit = () => {
    setShowCompletionModal(false);
    router.push("/dashboard/my-tasks");
  };

  // Handle exam started from Waiting Room
  const handleExamStarted = () => {
    setIsExamStarted(true);
    setCheckingEligibility(false); // Stop showing loading/waiting
  };

  // Mark student as left when they close/leave the exam page
  useEffect(() => {
    // Only for non-practice mode and when we have a submission
    if (isPracticeMode || !existingDraft?.id) return;

    const markAsLeft = async () => {
      try {
        await authAxios.post(`/submissions/${existingDraft.id}/mark-left/`);
      } catch (error) {
        console.error("Error marking as left:", error);
        // Silent fail - not critical
      }
    };

    // Handle page unload (close tab, refresh, navigate away)
    const handleBeforeUnload = (e) => {
      // Use sendBeacon for reliable delivery even when page is closing
      // Fallback to synchronous XHR if sendBeacon not available
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/submissions/${existingDraft.id}/mark-left/`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (navigator.sendBeacon) {
        // Modern approach - more reliable
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // sendBeacon doesn't support custom headers directly, so we encode in URL
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback to synchronous XHR (blocks page unload until complete)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false); // false = synchronous
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        try {
          xhr.send(JSON.stringify({}));
        } catch (err) {
          console.error("Failed to mark as left:", err);
        }
      }
    };

    // Handle navigation away from exam (using Next.js router)
    const handleRouteChange = () => {
      markAsLeft();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
      
      // Also mark as left on component unmount
      markAsLeft();
    };
  }, [existingDraft?.id, isPracticeMode, router]);

  // Loading state
  if (loading || taskLoading || (task?.task_type === 'EXAM_MOCK' && checkingEligibility)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">{intl.formatMessage({ id: "Loading exam..." })}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (taskError || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {intl.formatMessage({ id: "Failed to load exam" })}
          </p>
          <button
            onClick={() => router.push("/dashboard/my-tasks")}
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90"
          >
            {intl.formatMessage({ id: "Back to My Tasks" })}
          </button>
        </div>
      </div>
    );
  }

  // SCENARIO 1: EXAM_MOCK Waiting Room
  // If it's an exam mock, logic says we need to wait if not eligible
  // Exception: If we have a draft, we can probably resume (assuming eligibility checks pass for existing drafts or backend handles it)
  if (task.task_type === 'EXAM_MOCK' && !isPracticeMode && !isExamStarted && !existingDraft) {
    return (
      <WaitingRoom 
        taskId={task.id} 
        onExamStarted={handleExamStarted} 
      />
    );
  }

  // SCENARIO 4: QUIZ
  if (task.task_type === 'QUIZ') {
    return (
      <>
        <Seo title={task.title} />
        <QuizRunner 
          task={task}
          normalizedData={normalizedData}
          existingDraft={existingDraft}
          onSubmissionComplete={handleSubmissionComplete}
        />
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onRetry={handleRetry}
          onExit={handleExit}
          submission={completedSubmission}
          task={task}
        />
      </>
    );
  }

  // SCENARIO 2 & 3: EXAM_MOCK (Started) or PRACTICE_MOCK
  return (
    <>
      <Seo
        title={task?.title || "Exam Room"}
        description=""
        keywords=""
      />
      <ExamRoomLayout
        task={task}
        normalizedData={normalizedData}
        existingDraft={isPracticeMode ? null : existingDraft}
        user={user}
        mode={isPracticeMode ? 'practice' : 'exam'}
        onSubmissionComplete={isPracticeMode ? null : handleSubmissionComplete}
      />

      {/* Task Completion Modal (for non-EXAM tasks) */}
      {!isPracticeMode && task?.task_type !== 'EXAM_MOCK' && (
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onRetry={handleRetry}
          onExit={handleExit}
          submission={completedSubmission}
          task={task}
        />
      )}
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Exam Room",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(ExamRoomPage, ["STUDENT", "GUEST"]);
