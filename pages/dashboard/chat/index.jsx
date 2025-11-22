import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { StudentChatInterface } from "@/components/dashboard/chat/student-chat-interface";

function ChatPage({ info, user, loading }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper title={"Messages"} isLink body={"Dashboard"}>
          <StudentChatInterface user={user} loading={loading} />
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Messages",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(ChatPage, ["STUDENT", "GUEST"]);

