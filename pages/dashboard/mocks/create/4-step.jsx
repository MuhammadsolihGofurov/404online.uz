import { ThirdStepForms } from "@/components/dashboard/mocks";
import { StepsWrapper } from "@/components/dashboard/mocks/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { MOCK_CREATE_STEPS } from "@/mock/data";
import { MOCKS_CREATE_THIRD_STEP_URL } from "@/mock/router";
import { useRouter } from "next/router";

function FourthPage({ info, user, loading }) {
  const router = useRouter();
  const { findParams } = useParams();

  if (!findParams("mock_id")) {
    router.push(MOCKS_CREATE_THIRD_STEP_URL);
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
            "In this step, you can add questions related to the mock sections you created earlier. Prepare questions, assign them to the appropriate passages or tasks, and ensure each question is properly structured with answers and options if needed."
          }
          steps={MOCK_CREATE_STEPS}
          currentStep={4}
          alert_type="info"
        ></StepsWrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Create || Fourth step",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(FourthPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
