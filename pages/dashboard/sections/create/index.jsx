// pages/dashboard/index.js
import { Wrapper } from "@/components/dashboard/details";
import { SectionCreator } from "@/components/dashboard/sections/steps";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { SECTIONS_URL } from "@/mock/router";
import { useRouter } from "next/router";

function SectionCreatePage({ info, user, loading }) {
  const router = useRouter();
  const { findParams } = useParams();

  const sectionType = findParams("section") || "";

  if (!sectionType) {
    router.push(SECTIONS_URL);
  }

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={`Create ${sectionType}`}
          isLink
          body={"Sections"}
          url={SECTIONS_URL}
        >
          <SectionCreator type={sectionType} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Section Create | Welcome",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(SectionCreatePage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
