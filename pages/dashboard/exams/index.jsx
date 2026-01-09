import { Wrapper } from "@/components/dashboard/details";
import { ExamList } from "@/components/dashboard/exams";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import React from "react";

function ExamsPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper title="Exams" body="Dashboard" isLink={true} isButton={false}>
          <ExamList loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Exams",
    seo_home_keywords: "exams, exam results, student exams",
    seo_home_description: "View your exam results and scores",
  };
  return { props: { info } };
}

export default withAuthGuard(ExamsPage, [
  "STUDENT"
]);
