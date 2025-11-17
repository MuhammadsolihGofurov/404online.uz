// pages/dashboard/index.js
import { Analytics, Wrapper } from "@/components/dashboard/details";
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
        <Wrapper
          title={"Welcome to Dashboard!"}
          name={user?.full_name || user?.role}
        >
          <Analytics
            role={user?.role}
            loading={loading}
            user_avatar={user?.avatar}
            full_name={user?.full_name}
          />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Dashboard | Welcome",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, [
  "OWNER",
  "CENTER_ADMIN",
  "STUDENT",
  "TEACHER",
  "ASSISTANT",
]);
