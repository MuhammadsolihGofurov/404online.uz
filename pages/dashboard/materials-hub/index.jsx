// pages/dashboard/index.js
import { Wrapper } from "@/components/dashboard/details";
import { MaterialsTypes } from "@/components/dashboard/details/filters";
import {
  DocumentsLists,
  TempletesLists,
  TraniningZoneLists,
} from "@/components/dashboard/materials";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";

const sections = [
  {
    key: "DOCUMENTS",
    title: "Documents",
    body: "Dashboard",
    isButton: true,
    buttonFunc: "documentsModal",
    buttonText: "Create document",
    modalType: "short",
    component: "DocumentsLists",
    box: DocumentsLists,
  },
  {
    key: "TEMPLATES",
    title: "Templates",
    body: "Dashboard",
    isButton: true,
    buttonFunc: "templatesModal",
    buttonText: "Create template",
    modalType: "big",
    component: "TempletesLists",
    box: TempletesLists,
  },
  {
    key: "TRAINING_ZONE",
    title: "Traning zone",
    body: "Dashboard",
    isButton: false,
    buttonFunc: "templatesModal",
    buttonText: "Create template",
    modalType: "big",
    component: "TempletesLists",
    box: TraniningZoneLists,
  },
];

function MaterialsPage({ info, user, loading }) {
  const { findParams } = useParams();
  const currentPageType = findParams("type");

  // Hozirgi sectionni aniqlaymiz
  const currentSection = sections.find((s) => s.key === currentPageType);
  const BoxComponent = currentSection.box;

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        {currentSection && (
          <Wrapper
            title={currentSection.title}
            body={currentSection.body}
            isLink={true}
            isButton={
              user?.role !== "STUDENT" &&
              user?.role !== "OWNER" &&
              currentSection.isButton
            }
            buttonFunc={currentSection.buttonFunc}
            buttonText={currentSection.buttonText}
            modalType={currentSection.modalType}
          >
            <MaterialsTypes role={user?.role} />
            <BoxComponent
              loading={loading}
              role={user?.role}
              user_id={user?.id}
              key={currentSection?.key}
            />
          </Wrapper>
        )}
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Materials Hub",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(MaterialsPage, [
  "OWNER",
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
]);
