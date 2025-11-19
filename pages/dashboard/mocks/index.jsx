import { Wrapper } from "@/components/dashboard/details";
import { MocksList } from "@/components/dashboard/mocks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { MOCKS_CREATE_FIRST_STEP_URL } from "@/mock/router";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";

function DashboardPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={"Mocks"}
          isLink
          body={"Dashboard"}
          isButton
          buttonFunc={() => router.push(MOCKS_CREATE_FIRST_STEP_URL)}
          buttonText={intl.formatMessage({ id: "Create mock" })}
        >
          <MocksList loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
