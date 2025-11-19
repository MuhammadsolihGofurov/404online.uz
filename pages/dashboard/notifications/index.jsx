import { Wrapper } from "@/components/dashboard/details";
import { NotificationItem } from "@/components/dashboard/notifications";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { NotificationItemSkeleton } from "@/components/skeleton";
import { useIntl } from "react-intl";
import { useSelector, useDispatch } from "react-redux";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

function DashboardPage({ info, user, loading }) {
  const { notifications } = useSelector((state) => state.settings);
  const dispatch = useDispatch();
  const intl = useIntl();

  // 🔹 Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await authAxios.post("/notifications/mark_all_read/");

      // Redux state update: barcha notifications = read
      // const updated = notifications.map((n) => ({ ...n, is_read: true }));
      // dispatch(setNotificationsData(updated));

      toast.success(
        intl.formatMessage({ id: "All notifications marked as read" })
      );
    } catch (error) {
      toast.error(intl.formatMessage({ id: "Failed to mark all as read" }));
      console.error(error);
    }
  };

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={"Notifications"}
          isLink
          body={"Dashboard"}
          isButton={notifications?.some((n) => !n.is_read)}
          buttonFunc={handleMarkAllRead}
          buttonText={intl.formatMessage({ id: "Mark all as read" })}
          isIcon
        >
          {/* 🔹 Notifications List */}
          {loading ? (
            [...Array(5)].map((_, i) => <NotificationItemSkeleton key={i} />)
          ) : notifications?.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {intl.formatMessage({ id: "No notifications yet" })}
            </div>
          ) : (
            notifications.map((n) => <NotificationItem key={n.id} item={n} />)
          )}
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Notifications",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(DashboardPage, [
  "OWNER",
  "CENTER_ADMIN",
  "TEACHER",
  "STUDENT",
  "ASSISTANT",
]);
