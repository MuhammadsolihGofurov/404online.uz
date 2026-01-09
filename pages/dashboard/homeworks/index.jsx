import { Wrapper } from "@/components/dashboard/details";
import { HomeworkList } from "@/components/dashboard/homeworks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import React from "react";

function HomeworksPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title="Homeworks"
          body="Dashboard"
          isLink={true}
          isButton={false}
        >
          <HomeworkList loading={loading} role={user?.role} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Homeworks",
    seo_home_keywords: "homework, assignments, student homework",
    seo_home_description: "View your homework assignments and submissions",
  };
  return { props: { info } };
}

export default withAuthGuard(HomeworksPage, ["STUDENT", "GUEST"]);
