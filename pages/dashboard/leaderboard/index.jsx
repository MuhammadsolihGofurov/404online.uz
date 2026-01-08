// pages/dashboard/index.js
import { UsersListTable } from "@/components/dashboard";
import { Wrapper } from "@/components/dashboard/details";
import {
  FilterLeaderboard,
  UserFilter,
} from "@/components/dashboard/details/filters";
import { LeaderboardLists } from "@/components/dashboard/leaderboard";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function LeaderboardPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper title={"Leaderboard"} isLink body={"Dashboard"}>
          <FilterLeaderboard />
          <LeaderboardLists loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Leaderboard",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(LeaderboardPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "STUDENT",
  "ASSISTANT",
]);
