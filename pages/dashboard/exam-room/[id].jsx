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

function ExamRoomPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = router.query;
  const [normalizedData, setNormalizedData] = useState(null);
  const [existingDraft, setExistingDraft] = useState(null);

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

  // Fetch existing draft submission
  const { data: draftData } = useSWR(
    id && user?.id ? ["/submissions/", router.locale, id, user.id] : null,
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

  // Loading state
  if (loading || taskLoading || !normalizedData) {
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
        existingDraft={existingDraft}
        user={user}
      />
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

