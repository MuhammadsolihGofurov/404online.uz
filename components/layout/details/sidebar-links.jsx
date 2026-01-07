import { SidebarLinksSkeleton } from "@/components/skeleton";
import {
  DASHBOARD_URL,
  EXAMS_URL,
  GROUPS_URL,
  HOMEWORKS_URL,
  INVITECODE_URL,
  MATERIALSHUB_URL,
  MOCKS_URL,
  MY_RESULTS_URL,
  SECTIONS_URL,
  SETTINGS_URL,
  TASKS_URL,
  USERS_URL,
} from "@/mock/router";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
// Lucide ikonkalari
import {
  LayoutDashboard,
  Building2,
  Users,
  Ticket,
  Layers,
  Grid2X2,
  Database,
  FileText,
  Mail,
  ClipboardCheck,
  Settings,
  GraduationCap,
} from "lucide-react";

const OwnerMenuItems = [
  {
    title: "Education center",
    href: "/dashboard/education-centers",
    icon: Building2,
    roles: ["OWNER"],
  },
];

const CenterAdminMenuItems = [
  {
    title: "Users",
    href: USERS_URL,
    icon: Users,
    roles: ["CENTER_ADMIN"],
  },
  {
    title: "Invitation codes",
    href: INVITECODE_URL,
    icon: Ticket,
    roles: ["CENTER_ADMIN"],
  },
  {
    title: "Groups",
    href: GROUPS_URL,
    icon: Layers,
    roles: ["CENTER_ADMIN"],
  },
];

const menuItems = [
  {
    title: "Dashboard",
    href: DASHBOARD_URL,
    icon: LayoutDashboard,
    roles: ["OWNER", "CENTER_ADMIN", "TEACHER", "ASSISTANT", "STUDENT"],
  },
  ...OwnerMenuItems,
  ...CenterAdminMenuItems,
  {
    title: "Mocks",
    href: SECTIONS_URL,
    icon: Grid2X2,
    roles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT"],
    query: `?section=listening`,
  },
  {
    title: "Materials Hub",
    href: MATERIALSHUB_URL,
    icon: Database,
    roles: ["OWNER", "CENTER_ADMIN", "TEACHER", "ASSISTANT", "STUDENT"],
    query: `?type=DOCUMENTS`,
  },
  {
    title: "Tasks",
    href: TASKS_URL,
    icon: FileText,
    roles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT"],
    query: `?type=exams`,
  },
  {
    title: "Exams",
    href: EXAMS_URL,
    icon: Mail,
    roles: ["STUDENT", "CENTER_ADMIN", "TEACHER", "ASSISTANT"],
  },
  {
    title: "Homeworks",
    href: HOMEWORKS_URL,
    icon: ClipboardCheck,
    roles: ["STUDENT", "CENTER_ADMIN", "TEACHER", "ASSISTANT"],
  },
  {
    title: "My Results",
    href: MY_RESULTS_URL,
    icon: GraduationCap,
    roles: ["STUDENT"],
  },
  {
    title: "Settings",
    href: SETTINGS_URL,
    icon: Settings,
    roles: ["OWNER", "CENTER_ADMIN", "TEACHER", "STUDENT", "ASSISTANT"],
  },
];

export default function SidebarLinks({ userRole, closeSidebar }) {
  const router = useRouter();
  const intl = useIntl();

  if (!userRole) {
    return <SidebarLinksSkeleton />;
  }

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="flex-1 p-4 space-y-2 h-[500px] overflow-y-auto scrollbar-hide">
      {filteredItems.map((item) => {
        const isActive = router.pathname === item.href;
        const IconComponent = item.icon;

        const handleClick = () => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            closeSidebar?.();
          }
        };

        return (
          <Link
            key={item.title}
            href={item.href + (item?.query ? item.query : "")}
            onClick={handleClick}
            className={`flex items-center gap-3 relative px-4 py-2 rounded-lg transition-colors duration-200 
              ${
                isActive
                  ? "text-textPrimary bg-blue-50/50"
                  : "text-menu hover:text-textPrimary hover:bg-blue-50"
              }`}
          >
            <span
              className={`w-5 h-5 flex items-center justify-center ${
                isActive ? "text-main" : "text-menu"
              }`}
            >
              <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
            </span>

            <span className="text-sm font-medium">
              {intl.formatMessage({
                id: item.title,
                defaultMessage: item.title,
              })}
            </span>

            {/* Active Indicator */}
            <span
              className={`w-1 absolute top-2/4 -translate-y-2/4 rounded-full right-0 bg-main transition-all duration-300 ${
                isActive ? "h-[60%]" : "h-0 opacity-0"
              }`}
            ></span>
          </Link>
        );
      })}
    </nav>
  );
}
