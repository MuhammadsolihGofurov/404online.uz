import { Wrapper } from "@/components/dashboard/details";
import { ExamTaking } from "@/components/dashboard/exams";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import React from "react";
import { useRouter } from "next/router";

function TaskTakePage({ info, user, loading }) {
  const router = useRouter();
  const { type, id } = router.query;

  const taskTypeLabels = {
    exams: "Exam",
    homeworks: "Homework",
    mocks: "Practice Mock",
  };

  const title = taskTypeLabels[type] || "Task";

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} hideSidebar>
        <ExamTaking
          loading={loading}
          role={user?.role}
          taskType={type}
          taskId={id}
        />
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { type } = params;
  const typeLabels = {
    exams: "Exam",
    homeworks: "Homework",
    mocks: "Practice Mock",
  };

  const info = {
    seo_home_title: `Take ${typeLabels[type] || "Task"}`,
    seo_home_keywords: "test, questions, answers",
    seo_home_description: `Take your ${typeLabels[type] || "task"} test`,
  };
  return { props: { info } };
}

export default withAuthGuard(TaskTakePage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
]);
