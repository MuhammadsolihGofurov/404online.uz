// pages/dashboard/index.js
import { Analytics, Wrapper } from "@/components/dashboard/details";
import { SectionFilter } from "@/components/dashboard/details/filters";
import { SectionLists } from "@/components/dashboard/sections";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { SECTIONS_CREATE_URL } from "@/mock/router";
import { useRouter } from "next/router";

function SectionsPage({ info, user, loading }) {
  const router = useRouter();

  const dropdownList = [
    {
      id: 1,
      title: "Listening",
      url: SECTIONS_CREATE_URL + "?section=listening",
    },
    {
      id: 2,
      title: "Reading",
      url: SECTIONS_CREATE_URL + "?section=reading",
    },
    {
      id: 3,
      title: "Writing",
      url: SECTIONS_CREATE_URL + "?section=writing",
    },
  ];

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={"Sections"}
          isLink
          body={"Dashboard"}
          isDropdown={true}
          buttonText={"Create section"}
          dropdownList={dropdownList}
        >
          <SectionFilter />
          <SectionLists />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Sections | Welcome",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(SectionsPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
