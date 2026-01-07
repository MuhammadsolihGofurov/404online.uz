import { Wrapper } from "@/components/dashboard/details";
import { TasksFilter } from "@/components/dashboard/details/filters";
import { TasksLists } from "@/components/dashboard/tasks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useOffcanvas } from "@/context/offcanvas-context";

function TasksResultsHomeworkPage({ info, user, loading }) {
  const { openOffcanvas } = useOffcanvas();

  const dropdownList = [
    {
      id: 1,
      title: "Exams",
      func: () => openOffcanvas("taskExamsGeneratorOffcanvas", {}, "right"),
    },
    {
      id: 2,
      title: "Homeworks",
      func: () => openOffcanvas("taskHomeworksGeneratorOffcanvas", {}, "right"),
    },
  ];

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={"Tasks"}
          isLink
          body={"Dashboard"}
          isDropdown
          buttonText={"Create task"}
          dropdownList={dropdownList}
        ></Wrapper>
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
