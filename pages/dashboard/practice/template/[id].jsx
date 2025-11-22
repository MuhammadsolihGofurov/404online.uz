import { withAuthGuard } from "@/components/guard/dashboard-guard";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useState, useEffect } from "react";
import { ExamRoomLayout } from "@/components/exam/exam-room-layout";
import { ExamDataNormalizer } from "@/components/exam/exam-data-normalizer";

function TemplatePracticePage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = router.query;
  const [normalizedData, setNormalizedData] = useState(null);

  // Fetch template details
  const { data: template, isLoading: templateLoading, error: templateError } = useSWR(
    id ? ["/material-templates/", router.locale, id] : null,
    async ([url, locale]) => {
      const templateData = await fetcher(
        `${url}${id}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      );

      // Template has mocks, fetch full mock details with sections and questions
      if (templateData && templateData.mocks && templateData.mocks.length > 0) {
        const mockDetails = await Promise.all(
          templateData.mocks.map((mock) =>
            fetcher(
              `/mocks/${mock.id || mock}/`,
              {
                headers: {
                  "Accept-Language": locale,
                },
              },
              {},
              true
            ).catch((err) => {
              console.error(`Error fetching mock ${mock.id || mock}:`, err);
              return null;
            })
          )
        );

        // Replace mock objects with full details
        templateData.mocks = mockDetails.filter(Boolean);
      }

      return templateData;
    }
  );

  // Normalize data when template is loaded
  useEffect(() => {
    if (template) {
      // Convert template to task-like structure for ExamDataNormalizer
      // Templates have mocks, similar to PRACTICE_MOCK tasks
      const taskLikeData = {
        id: template.id,
        title: template.title,
        task_type: "PRACTICE_MOCK", // Treat as practice mock
        mocks: template.mocks || [],
        allow_audio_pause: true, // Practice mode always allows pause
      };

      const normalized = ExamDataNormalizer.normalize(taskLikeData);
      setNormalizedData(normalized);
    }
  }, [template]);

  // Loading state
  if (loading || templateLoading || !normalizedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">{intl.formatMessage({ id: "Loading practice..." })}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (templateError || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {intl.formatMessage({ id: "Failed to load template" })}
          </p>
          <button
            onClick={() => router.push("/dashboard/materials-hub?type=TRAINING_ZONE")}
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90"
          >
            {intl.formatMessage({ id: "Back to Training Zone" })}
          </button>
        </div>
      </div>
    );
  }

  // Create task-like object for ExamRoomLayout
  const taskLikeObject = {
    id: template.id,
    title: template.title,
    task_type: "PRACTICE_MOCK",
    allow_audio_pause: true,
    duration_minutes: null, // No time limit for practice
  };

  return (
    <>
      <Seo
        title={template?.title || "Practice"}
        description=""
        keywords=""
      />
      <ExamRoomLayout
        task={taskLikeObject}
        normalizedData={normalizedData}
        existingDraft={null}
        user={user}
        mode="practice"
        templateId={template.id} // Pass template ID for self_check endpoint
      />
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Practice Template",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(TemplatePracticePage, ["STUDENT", "GUEST"]);

