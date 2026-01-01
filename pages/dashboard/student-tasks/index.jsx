import { Wrapper } from "@/components/dashboard/details";
import { StudentTasksLists } from "@/components/dashboard/student-tasks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function StudentTasksPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={"My Tasks"}
          isLink
          body={"Dashboard"}
          isButton={false}
        >
          <StudentTasksLists loading={loading} user={user} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "My Tasks",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(StudentTasksPage, ["STUDENT"]);
