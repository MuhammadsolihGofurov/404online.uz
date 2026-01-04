// pages/dashboard/index.js
import { Wrapper } from "@/components/dashboard/details";
import {
  PartsWrapper,
  SectionCreator,
} from "@/components/dashboard/sections/steps";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { SECTIONS_CREATE_URL, SECTIONS_URL } from "@/mock/router";
import { useRouter } from "next/router";
import { useEffect } from "react";

function SectionPartsPage({ info, user, loading }) {
  const router = useRouter();
  const { findParams } = useParams();

  const sectionType = findParams("section") || "";
  const sectionId = findParams("sectionId") || "";

  useEffect(() => {
    if (!sectionType && !sectionId) {
      router.push(SECTIONS_URL);
    }
  }, []);

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={`Customize ${sectionType} parts`}
          isLink
          body={"Sections"}
          url={SECTIONS_CREATE_URL + `?section=${sectionType}`}
        >
          <PartsWrapper />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Section Parts | Welcome",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(SectionPartsPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);

// export default SectionPartsPage;
