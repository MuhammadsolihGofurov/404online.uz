// pages/dashboard/index.js
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";

function DashboardPage({ info, user }) {
  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.full_name} 👋
          </h2>
          <p className="text-gray-600">
            Here’s what’s happening with your account today.
          </p>
          {/* Example Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold">Active Orders</h3>
              <p className="text-3xl font-bold text-main mt-2">12</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold">New Messages</h3>
              <p className="text-3xl font-bold text-main mt-2">5</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold">Revenue</h3>
              <p className="text-3xl font-bold text-main mt-2">$2,430</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Dashboard | Welcome",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, ["OWNER", "manager", "user"]);
