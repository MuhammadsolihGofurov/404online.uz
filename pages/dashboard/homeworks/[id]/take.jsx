import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import HomeworkTaking from "@/components/dashboard/homeworks/homework-taking";
import React from "react";

function HomeworkTakePage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title || "Take Homework"}
        description={
          info?.seo_home_description || "Take your homework assignment"
        }
        keywords={info?.seo_home_keywords || "homework, take, assignment"}
      />
      <DashboardLayout user={user} hideSidebar>
        <HomeworkTaking loading={loading} role={user?.role} />
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Take Homework",
    seo_home_keywords: "homework, take, assignment, student",
    seo_home_description: "Take your homework assignment online.",
  };
  return { props: { info } };
}

export default withAuthGuard(HomeworkTakePage, ["STUDENT", "GUEST"]);
