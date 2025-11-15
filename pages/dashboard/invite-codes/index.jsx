// pages/dashboard/index.js
import { InviteCodeListTable, TeachersListTable } from "@/components/dashboard";
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
          title={"Invitation codes"}
          isLink
          body={"Dashboard"}
          isButton
          buttonText={"Add invite code"}
          modalType={"short"}
          buttonFunc={"addTeacher"}
        >
          <InviteCodeListTable loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Invite codes",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, ["CENTER_ADMIN"]);
