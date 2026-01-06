// pages/dashboard/index.js
import { EduCentersTable, MySettings } from "@/components/dashboard";
import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function DashboardPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper title={"My Settings"} isLink body={"Dashboard"}>
          <MySettings user={user} loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Settings",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, [
  "OWNER",
  "CENTER_ADMIN",
  "TEACHER",
  "STUDENT",
  "ASSISTANT",
]);
