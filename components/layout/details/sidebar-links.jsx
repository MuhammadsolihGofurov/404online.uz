import { Home, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";


const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={20} />,
  },
];

export default function SidebarLinks() {
  const router = useRouter();
  const intl = useIntl();

  return (
    <nav className="flex-1 p-4 space-y-2">
      {menuItems.map((item) => {
        const isActive = router.pathname === item.href;

        const onClickFn = () => {
          if (typeof window !== "undefined" && window.innerWidth < 640) {
            closeSidebar();
          }
        };

        return (
          <Link
            key={item.title}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? "bg-main text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={onClickFn}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
