import { ThirdStepForms } from "@/components/dashboard/mocks";
import { StepsWrapper } from "@/components/dashboard/mocks/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { MOCK_CREATE_STEPS } from "@/mock/data";
import { MOCKS_CREATE_SECOND_STEP_URL } from "@/mock/router";
import { useRouter } from "next/router";

function ThirdPage({ info, user, loading }) {
  const router = useRouter();
  const { findParams } = useParams();

  if (!findParams("mock_id")) {
    router.push(MOCKS_CREATE_SECOND_STEP_URL);
  }

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <StepsWrapper
          description={
            "In this step, prepare the required content for the mock. Based on the selected mock type, you can add passages, audio materials, tasks, and related questions to complete the section"
          }
          steps={MOCK_CREATE_STEPS}
          currentStep={3}
          alert_type="info"
        >
          <ThirdStepForms />
        </StepsWrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Create || Third step",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(ThirdPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
