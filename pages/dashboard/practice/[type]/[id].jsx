import { PracticeTaking } from "@/components/dashboard/practice";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import React from "react";

function PracticeTakePage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} hideSidebar>
        <PracticeTaking loading={loading} />
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Practice Mock",
    seo_home_keywords: "practice, mock, listening, reading",
    seo_home_description: "Take a practice mock test",
  };
  return { props: { info } };
}

export default withAuthGuard(PracticeTakePage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
]);
