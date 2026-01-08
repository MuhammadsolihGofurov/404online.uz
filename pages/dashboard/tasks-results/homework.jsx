import { Wrapper } from "@/components/dashboard/details";
import { TasksHomeworkLists } from "@/components/dashboard/tasks-homework";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function TasksResultsHomeworkPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper title={"Homework result"} isLink body={"Dashboard"}>
          <TasksHomeworkLists role={user?.role} loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Homework results",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(TasksResultsHomeworkPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
