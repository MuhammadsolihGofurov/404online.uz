import React, { useEffect, useMemo, useRef, memo } from "react";
import { Bell, Menu, MessageCircle } from "lucide-react";
import Link from "next/link";
import { CHATS_URL, NOTIFICATIONS_URL } from "@/mock/router";
import { useRouter } from "next/router";
import { useNotifications } from "@/hooks/useNotifications";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { useDispatch } from "react-redux";
import { setNotificationsData } from "@/redux/slice/settings";

const ICONS = [
  {
    id: 1,
    icon: MessageCircle,
    href: CHATS_URL,
  },
  {
    id: 2,
    icon: Bell,
    href: NOTIFICATIONS_URL,
  },
];

const UserAvatar = memo(({ user }) => (
  <div className="w-9 h-9 bg-main text-white rounded-full flex items-center justify-center overflow-hidden">
    <img
      src={user?.avatar}
      alt={user?.full_name}
      loading="lazy"
      className="w-full h-full object-cover"
    />
  </div>
));

UserAvatar.displayName = "UserAvatar";

const HeaderIcon = memo(({ icon: Icon, href, isActive, badgeCount }) => (
  <Link
    href={href}
    className={`relative z-0 p-1 rounded-md transition-colors ${
      isActive ? "text-main bg-main/10" : "text-gray-700"
    }`}
  >
    <Icon className="w-4 h-4" />
    {/* {badgeCount > 0 && ( */}
    <span className="absolute -top-[2px] -right-[2px] bg-main text-white rounded-full text-[9px] w-2 h-2 flex items-center justify-center">
      {/* {badgeCount > 9 ? "9+" : badgeCount} */}
    </span>
    {/* )} */}
  </Link>
));

HeaderIcon.displayName = "HeaderIcon";

function Header({ user, toggleSidebar }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const renderCount = useRef(0);
  const lastNotificationCount = useRef(0);

  // // ✅ Token'ni faqat bir marta olish
  // const token = useMemo(
  //   () =>
  //     typeof window !== "undefined" ? localStorage.getItem(PRIVATEAUTHKEY) : "",
  //   []
  // );

  // const { notifications, isConnected } = useNotifications(token);

  // ✅ Render count tracking
  useEffect(() => {
    renderCount.current += 1;
    console.error(`🔄 Header rendered ${renderCount.current} times`);
  });

  // ✅ O'qilmagan notificationlarni hisoblash
  // const unreadCount = useMemo(() => {
  //   if (!notifications || notifications.length === 0) return 0;
  //   return notifications.filter((item) => !item?.is_read).length;
  // }, [notifications]);

  // useEffect(() => {
  //   const currentCount = notifications?.length || 0;

  //   if (
  //     currentCount !== lastNotificationCount.current &&
  //     notifications?.length > 0
  //   ) {
  //     lastNotificationCount.current = currentCount;
  //     dispatch(setNotificationsData(notifications));
  //     console.log("📤 Dispatched to Redux:", currentCount, "notifications");
  //   }
  // }, [notifications?.length, dispatch]);

  return (
    <header className="flex items-center justify-between bg-white shadow-sm px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          type="button"
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <h1 className="sm:block hidden text-lg font-semibold text-gray-800">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {ICONS.map(({ id, icon, href }) => {
          const isActive = router.pathname === href;
          const badgeCount = href === NOTIFICATIONS_URL ? 1 : 0;

          return (
            <HeaderIcon
              key={id}
              icon={icon}
              href={href}
              isActive={isActive}
              badgeCount={badgeCount}
            />
          );
        })}

        <UserAvatar user={user} />
      </div>
    </header>
  );
}

export default memo(Header, (prevProps, nextProps) => {
  return (
    prevProps.user?.avatar === nextProps.user?.avatar &&
    prevProps.user?.full_name === nextProps.user?.full_name &&
    prevProps.toggleSidebar === nextProps.toggleSidebar
  );
});
