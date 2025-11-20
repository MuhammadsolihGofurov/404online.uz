import { Wrapper } from "@/components/dashboard/details";
import { MockView } from "@/components/dashboard/mocks";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import { MOCKS_URL } from "@/mock/router";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";

function MockViewPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentMockId = findParams("mock_id");

  if (!currentMockId) {
    router.push(MOCKS_URL);
  }

  const { data: mock, isLoading } = useSWR(
    ["/mocks", router.locale, currentMockId, modalClosed],
    ([url, locale]) =>
      fetcher(
        `${url}/${currentMockId}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <MockView mock={mock} loading={isLoading}/>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Views",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(MockViewPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
