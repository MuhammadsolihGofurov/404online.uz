import React, { useEffect } from "react";
import { Bell, Menu, MessageCircle } from "lucide-react";
import Link from "next/link";
import { CHATS_URL, NOTIFICATIONS_URL } from "@/mock/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import { useNotifications } from "@/hooks/useNotifications";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { useDispatch } from "react-redux";
import { setNotificationsData } from "@/redux/slice/settings";

export default function Header({ user, toggleSidebar }) {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem(PRIVATEAUTHKEY) : "";
  const { notifications, isConnected } = useNotifications(token);
  const dispatch = useDispatch();

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

  useEffect(() => {
    dispatch(setNotificationsData(notifications));
  }, [notifications]);

  const UnReadNotifications =
    notifications?.length > 0 ??
    notifications?.filter((item) => !item?.is_read);

  return (
    <header className="flex items-center justify-between bg-white shadow-sm px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Hamburger button */}
        <button
          onClick={toggleSidebar}
          type="button"
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu size={22} />
        </button>

        <h1 className="sm:block hidden text-lg font-semibold text-gray-800">
          Dashboard
        </h1>
      </div>
      {console.log("notifications", notifications)}
      {console.log("notification status", isConnected)}

      <div className="flex items-center gap-2">
        {/* Map orqali iconlarni chiqarish */}
        {ICONS.map(({ id, icon: Icon, href }) => {
          const isActive = router.pathname === href;

          return (
            <Link
              key={id}
              href={href}
              className={`relative z-0 p-1 rounded-md transition-colors ${
                isActive ? "text-main bg-main/10" : "text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {href === NOTIFICATIONS_URL && UnReadNotifications ? (
                <span className="absolute -top-1 -right-1 bg-main text-white rounded-full text-[9px] w-3 h-3 flex items-center justify-center">
                  {UnReadNotifications}
                </span>
              ) : (
                <></>
              )}
            </Link>
          );
        })}

        {/* Avatar */}
        <div className="w-9 h-9 bg-main text-white rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={user?.avatar}
            alt={user?.full_name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
