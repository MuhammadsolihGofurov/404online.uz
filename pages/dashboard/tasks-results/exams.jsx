import { Wrapper } from "@/components/dashboard/details";
import {
  FilterExams,
  TasksFilter,
} from "@/components/dashboard/details/filters";
import { TasksLists } from "@/components/dashboard/tasks";
import { TasksExamsList } from "@/components/dashboard/tasks-exams";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useParams } from "@/hooks/useParams";

function TasksResultsExamPage({ info, user, loading }) {
  const { openOffcanvas } = useOffcanvas();
  const { findParams } = useParams();
  const currentType = findParams("type");
  const isExam = currentType === "exams";

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
          title={isExam ? "Exam result" : "Homework result"}
          isLink
          body={"Dashboard"}
        >
          <FilterExams />
          <TasksExamsList />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Exam results",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(TasksResultsExamPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
