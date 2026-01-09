import { Wrapper } from "@/components/dashboard/details";
import { HomeworkDetail } from "@/components/dashboard/homeworks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { HOMEWORKS_URL } from "@/mock/router";
import React from "react";

function HomeworkDetailPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title="Homework Details"
          body="Homeworks"
          isLink={true}
          url={HOMEWORKS_URL}
          isButton={false}
        >
          <HomeworkDetail loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Homework Details",
    seo_home_keywords: "homework details, assignments, student tasks",
    seo_home_description: "View detailed information about the homework task",
  };
  return { props: { info } };
}

export default withAuthGuard(HomeworkDetailPage, ["STUDENT", "GUEST"]);
