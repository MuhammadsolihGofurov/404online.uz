import {
  EnterpriseCard,
  StepsWrapper,
} from "@/components/dashboard/mocks/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { MOCK_CREATE_STEPS } from "@/mock/data";
import { MOCKS_CREATE_SECOND_STEP_URL, MOCKS_URL } from "@/mock/router";
import { BookOpen, ListChecks, Settings } from "lucide-react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";

const templates = [
  {
    id: "EXAM_TEMPLATE",
    title: "For exam",
    description: "For formal assessments at scheduled times.",
    icon: ListChecks,
  },
  {
    id: "PRACTICE_TEMPLATE",
    title: "For practise",
    description: "For independent practice in the library.",
    icon: BookOpen,
  },
  {
    id: "CUSTOM",
    title: "Custom",
    description: "Quick quiz, share immediately.",
    icon: Settings,
  },
];


function FirstPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();

  const handleCardClick = (id) => {
    router.push(MOCKS_CREATE_SECOND_STEP_URL + `?category=${id}`);
  };

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <StepsWrapper
          title={"Choose a template"}
          description={
            "Select the template that best suits your goals: Structured Exam, Self-Paced Practice, or a fully Customized setup."
          }
          steps={MOCK_CREATE_STEPS}
          currentStep={1}
          alert_type="info"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {templates.map((tpl) => (
              <EnterpriseCard
                key={tpl.id}
                title={tpl.title}
                description={tpl.description}
                icon={tpl.icon}
                onClick={() => handleCardClick(tpl.id)}
              />
            ))}
          </div>
        </StepsWrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Create || First step",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(FirstPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
