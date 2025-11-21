import { Wrapper } from "@/components/dashboard/details";
import { TasksLists } from "@/components/dashboard/tasks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function TasksPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper title={"Tasks"} isLink body={"Dashboard"}>
          <TasksLists loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Tasks",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(TasksPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
