import { Wrapper } from "@/components/dashboard/details";
import { ExamDetail } from "@/components/dashboard/exams";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { EXAMS_URL } from "@/mock/router";
import React from "react";

function ExamDetailPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title="Exam Details"
          body="Exams"
          isLink={true}
          url={EXAMS_URL}
          isButton={false}
        >
          <ExamDetail loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Exam Details",
    seo_home_keywords: "exam details, mock test, ielts exam",
    seo_home_description: "View detailed information about the exam task",
  };
  return { props: { info } };
}

export default withAuthGuard(ExamDetailPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
]);
