import { Wrapper } from "@/components/dashboard/details";
import { ExamTaking } from "@/components/dashboard/exams";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import React from "react";

function ExamTakePage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} hideSidebar>
        <ExamTaking loading={loading} role={user?.role} />
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Take Exam",
    seo_home_keywords: "exam, test, ielts, questions, answers",
    seo_home_description: "Take your exam test",
  };
  return { props: { info } };
}

export default withAuthGuard(ExamTakePage, [
  "STUDENT",
]);
