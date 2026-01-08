// pages/dashboard/index.js
import { UsersListTable } from "@/components/dashboard";
import { Wrapper } from "@/components/dashboard/details";
import {
  FilterMyResults,
  UserFilter,
} from "@/components/dashboard/details/filters";
import { MyResultsLists } from "@/components/dashboard/my-results";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function MyResultsPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper title={"My results"} isLink body={"Dashboard"}>
          <FilterMyResults />
          <MyResultsLists role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "My results",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(MyResultsPage, ["STUDENT"]);
