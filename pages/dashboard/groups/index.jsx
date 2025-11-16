// pages/dashboard/index.js
import { GroupListCards, UsersListTable } from "@/components/dashboard";
import { Wrapper } from "@/components/dashboard/details";
import { UserFilter } from "@/components/dashboard/details/filters";
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
          title={"Groups"}
          isLink
          body={"Dashboard"}
          isButton
          buttonText={"Add group"}
          modalType={"short"}
          buttonFunc={"addGroup"}
        >
          <GroupListCards loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Groups",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, ["CENTER_ADMIN"]);
