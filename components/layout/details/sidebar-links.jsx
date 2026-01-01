import { SidebarLinksSkeleton } from "@/components/skeleton";
import {
  DASHBOARD_URL,
  GROUPS_URL,
  INVITECODE_URL,
  MATERIALSHUB_URL,
  MEMBERSHIPS_URL,
  MOCKS_URL,
  SECTIONS_URL,
  SETTINGS_URL,
  STUDENT_TASKS_URL,
  TASKS_URL,
  TEACHERS_URL,
  USERS_URL,
} from "@/mock/router";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";

const OwnerMenuItems = [
  {
    title: "Education center",
    href: "/dashboard/education-centers",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21M5 21V7L13 3V21M19 21V11L13 7M9 9V9.01M9 12V12.01M9 15V15.01M9 18V18.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      `,
    roles: ["OWNER"],
  },
];

const CenterAdminMenuItems = [
  {
    title: "Users",
    href: USERS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.364 18.3639C19.6227 17.1052 20.4798 15.5016 20.8271 13.7558C21.1743 12.0099 20.9961 10.2004 20.3149 8.55582C19.6337 6.91129 18.4802 5.50569 17.0001 4.51677C15.5201 3.52784 13.78 3 12 3C10.22 3 8.47992 3.52784 6.99988 4.51677C5.51984 5.50569 4.36629 6.91129 3.6851 8.55582C3.00391 10.2004 2.82567 12.0099 3.17293 13.7558C3.52019 15.5016 4.37734 17.1052 5.636 18.3639M11.7661 21.9999H12.2341C12.7216 22 13.1924 21.822 13.558 21.4994C13.9235 21.1768 14.1586 20.7317 14.2191 20.2479L14.7191 16.2479C14.7542 15.9665 14.7291 15.6808 14.6455 15.4098C14.5618 15.1388 14.4214 14.8887 14.2337 14.6761C14.046 14.4635 13.8152 14.2933 13.5566 14.1767C13.2981 14.0601 13.0177 13.9999 12.7341 13.9999H11.2661C10.9824 13.9999 10.7021 14.0601 10.4435 14.1767C10.185 14.2933 9.95416 14.4635 9.76644 14.6761C9.57871 14.8887 9.43835 15.1388 9.35466 15.4098C9.27098 15.6808 9.24589 15.9665 9.28106 16.2479L9.78106 20.2479C9.84152 20.7317 10.0766 21.1768 10.4422 21.4994C10.8077 21.822 11.2785 22 11.7661 21.9999ZM14 8.99992C14 10.1045 13.1046 10.9999 12 10.9999C10.8954 10.9999 10 10.1045 10 8.99992C10 7.89535 10.8954 6.99992 12 6.99992C13.1046 6.99992 14 7.89535 14 8.99992Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    roles: ["CENTER_ADMIN"],
  },
  {
    title: "Invitation codes",
    href: INVITECODE_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12H15M12 9V15M6 19C5.46957 19 4.96086 18.7893 4.58579 18.4142C4.21071 18.0391 4 17.5304 4 17V13L3 12L4 11V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5M18 19C18.5304 19 19.0391 18.7893 19.4142 18.4142C19.7893 18.0391 20 17.5304 20 17V13L21 12L20 11V7C20 6.46957 19.7893 5.96086 19.4142 5.58579C19.0391 5.21071 18.5304 5 18 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `,
    roles: ["CENTER_ADMIN"],
  },
  {
    title: "Groups",
    href: GROUPS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12L12 16L20 12M4 16L12 20L20 16M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      `,
    roles: ["CENTER_ADMIN"],
  },
];

const menuItems = [
  {
    title: "Dashboard",
    href: DASHBOARD_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_50_1939)">
      <path d="M4 13H10C10.55 13 11 12.55 11 12V4C11 3.45 10.55 3 10 3H4C3.45 3 3 3.45 3 4V12C3 12.55 3.45 13 4 13ZM4 21H10C10.55 21 11 20.55 11 20V16C11 15.45 10.55 15 10 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21ZM14 21H20C20.55 21 21 20.55 21 20V12C21 11.45 20.55 11 20 11H14C13.45 11 13 11.45 13 12V20C13 20.55 13.45 21 14 21ZM13 4V8C13 8.55 13.45 9 14 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3H14C13.45 3 13 3.45 13 4Z" fill="currentColor"/>
      </g>
      <defs>
      <clipPath id="clip0_50_1939">
      <rect width="24" height="24" fill="white"/>
      </clipPath>
      </defs>
      </svg>
      `,
    roles: ["OWNER", "CENTER_ADMIN", "TEACHER", "ASSISTANT", "STUDENT"],
  },
  ...OwnerMenuItems,
  ...CenterAdminMenuItems,
  {
    title: "Sections",
    href: SECTIONS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 7H20M17 4V10M5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5C4 4.44772 4.44772 4 5 4ZM5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15C4 14.4477 4.44772 14 5 14ZM15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15C14 14.4477 14.4477 14 15 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> `,
    roles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT"],
    query: `?section=listening`,
  },
  {
    title: "Materials Hub",
    href: MATERIALSHUB_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6C20 7.65685 16.4183 9 12 9C7.58172 9 4 7.65685 4 6M20 6C20 4.34315 16.4183 3 12 3C7.58172 3 4 4.34315 4 6M20 6V12M4 6V12M4 12C4 12.7956 4.84285 13.5587 6.34315 14.1213C7.84344 14.6839 9.87827 15 12 15C14.1217 15 16.1566 14.6839 17.6569 14.1213C19.1571 13.5587 20 12.7956 20 12M4 12V18C4 18.7956 4.84285 19.5587 6.34315 20.1213C7.84344 20.6839 9.87827 21 12 21C14.1217 21 16.1566 20.6839 17.6569 20.1213C19.1571 19.5587 20 18.7956 20 18V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
      `,
    roles: ["OWNER", "CENTER_ADMIN", "TEACHER", "ASSISTANT", "STUDENT"],
    query: `?type=DOCUMENTS`,
  },
  {
    title: "My Tasks",
    href: STUDENT_TASKS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `,
    roles: ["STUDENT"],
  },
  {
    title: "Tasks",
    href: TASKS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 7H15M9 11H15M9 15H13M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `,
    roles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT"],
    query: `?type=DOCUMENTS`,
  },
  {
    title: "Settings",
    href: SETTINGS_URL,
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.7389 4.5808 13.8642 4.82578 14.0407 5.032C14.2172 5.23822 14.4399 5.39985 14.6907 5.50375C14.9414 5.60764 15.2132 5.65085 15.4838 5.62987C15.7544 5.60889 16.0162 5.5243 16.248 5.383C17.791 4.443 19.558 6.209 18.618 7.753C18.4769 7.98466 18.3924 8.24634 18.3715 8.51677C18.3506 8.78721 18.3938 9.05877 18.4975 9.30938C18.6013 9.55999 18.7627 9.78258 18.9687 9.95905C19.1747 10.1355 19.4194 10.2609 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C19.4192 13.7389 19.1742 13.8642 18.968 14.0407C18.7618 14.2172 18.6001 14.4399 18.4963 14.6907C18.3924 14.9414 18.3491 15.2132 18.3701 15.4838C18.3911 15.7544 18.4757 16.0162 18.617 16.248C19.557 17.791 17.791 19.558 16.247 18.618C16.0153 18.4769 15.7537 18.3924 15.4832 18.3715C15.2128 18.3506 14.9412 18.3938 14.6906 18.4975C14.44 18.6013 14.2174 18.7627 14.0409 18.9687C13.8645 19.1747 13.7391 19.4194 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.2611 19.4192 10.1358 19.1742 9.95929 18.968C9.7828 18.7618 9.56011 18.6001 9.30935 18.4963C9.05859 18.3924 8.78683 18.3491 8.51621 18.3701C8.24559 18.3911 7.98375 18.4757 7.752 18.617C6.209 19.557 4.442 17.791 5.382 16.247C5.5231 16.0153 5.60755 15.7537 5.62848 15.4832C5.64942 15.2128 5.60624 14.9412 5.50247 14.6906C5.3987 14.44 5.23726 14.2174 5.03127 14.0409C4.82529 13.8645 4.58056 13.7391 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C4.5808 10.2611 4.82578 10.1358 5.032 9.95929C5.23822 9.7828 5.39985 9.56011 5.50375 9.30935C5.60764 9.05859 5.65085 8.78683 5.62987 8.51621C5.60889 8.24559 5.5243 7.98375 5.383 7.752C4.443 6.209 6.209 4.442 7.753 5.382C8.753 5.99 10.049 5.452 10.325 4.317Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`,
    roles: ["OWNER", "CENTER_ADMIN"],
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
    <nav className="flex-1 p-4 space-y-2">
      {filteredItems.map((item) => {
        const isActive = router.pathname === item.href;

        const handleClick = () => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            closeSidebar?.();
          }
        };

        return (
          <Link
            key={item.title}
            href={item.href + `${item?.query ? item?.query : ""}`}
            onClick={handleClick}
            className={`flex items-center gap-3 relative px-4 py-2 rounded-lg transition-colors duration-200 
              ${
                isActive
                  ? "text-textPrimary"
                  : "text-menu hover:text-textPrimary hover:bg-blue-50"
              }`}
          >
            <span
              className={`w-5 h-5 flex items-center justify-center ${
                isActive ? "text-main" : "text-menu"
              }`}
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />

            <span className="text-sm font-medium">
              {intl.formatMessage({
                id: item.title,
                defaultMessage: item.title,
              })}
            </span>

            <span
              className={`w-1 absolute top-2/4 -translate-y-2/4 rounded-full right-0 bg-main ${
                isActive ? "h-[70%] transition-all duration-200" : "h-0"
              }`}
            ></span>
          </Link>
        );
      })}
    </nav>
  );
}
