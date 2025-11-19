import {
  EnterpriseCard,
  StepsWrapper,
} from "@/components/dashboard/mocks/details";
import SecondStepForms from "@/components/dashboard/mocks/second-step-forms";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { MOCK_CREATE_STEPS } from "@/mock/data";
import { MOCKS_CREATE_FIRST_STEP_URL } from "@/mock/router";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";

function SecondPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { findParams } = useParams();

  if (!findParams("category")) {
    router.push(MOCKS_CREATE_FIRST_STEP_URL);
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
            "Fill in the required information below to continue creating your mock."
          }
          steps={MOCK_CREATE_STEPS}
          currentStep={2}
          alert_type="info"
        >
          <SecondStepForms />
        </StepsWrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Create || Second step",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(SecondPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
