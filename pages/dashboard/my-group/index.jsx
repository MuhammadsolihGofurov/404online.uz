import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { MyGroupInterface } from "@/components/dashboard/my-group/my-group-interface";

function MyGroupPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper title={"My Group"} isLink body={"Dashboard"}>
          <MyGroupInterface user={user} loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "My Group",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(MyGroupPage, ["STUDENT", "GUEST"]);

