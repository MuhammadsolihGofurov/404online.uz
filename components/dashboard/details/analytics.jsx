import { AnalyticsSkeleton, EduCardsSkeleton } from "@/components/skeleton";
import { EDUCATIONCENTERS_URL, SETTINGS_URL, USERS_URL } from "@/mock/router";
import fetcher from "@/utils/fetcher";
import { formatDateToLong } from "@/utils/funcs";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";

// Role to endpoint mapping
const ROLE_ENDPOINTS = {
  OWNER: "/analytics/owner/",
  CENTER_ADMIN: "/analytics/center/",
  TEACHER: "/analytics/teacher/",
  ASSISTANT: "/analytics/assistant/",
  STUDENT: "/analytics/student/",
};

// Helper function to get component based on role
const getAnalyticsComponent = (role) => {
  switch (role) {
    case "OWNER":
      return OwnerAnalytics;
    case "CENTER_ADMIN":
      return CenterAdminAnalytics;
    case "TEACHER":
      return TeacherAnalytics;
    case "ASSISTANT":
      return AssistantAnalytics;
    case "STUDENT":
      return StudentAnalytics;
    default:
      return OwnerAnalytics;
  }
};

export default function Analytics({ role, loading, user_avatar, full_name }) {
  const router = useRouter();
  const intl = useIntl();

  const request_url = ROLE_ENDPOINTS[role] || ROLE_ENDPOINTS.CENTER_ADMIN;

  const { data: analytics } = useSWR(
    [request_url, router.locale],
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (loading) {
    return (
      <>
        <AnalyticsSkeleton />
        <EduCardsSkeleton />
      </>
    );
  }

  const AnalyticsComponent = getAnalyticsComponent(role);

  return (
    <AnalyticsComponent
      data={analytics}
      router={router}
      intl={intl}
      user_avatar={user_avatar}
      role={role}
      full_name={full_name}
    />
  );
}

// Common SVG Icons
const ICONS = {
  building: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21M5 21V7L13 3V21M19 21V11L13 7M9 9V9.01M9 12V12.01M9 15V15.01M9 18V18.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  groups: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  tasks: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 7H15M9 11H15M9 15H13M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  reviews: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H7C6.46957 6 5.96086 6.21071 5.58579 6.58579C5.21071 6.96086 5 7.46957 5 8V17C5 17.5304 5.21071 18.0391 5.58579 18.4142C5.96086 18.7893 6.46957 19 7 19H16C16.5304 19 17.0391 18.7893 17.4142 18.4142C17.7893 18.0391 18 17.5304 18 17V14M20 7C20 8.65685 18.6569 10 17 10C15.3431 10 14 8.65685 14 7C14 5.34315 15.3431 4 17 4C18.6569 4 20 5.34315 20 7Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  materials: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  completed: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L20 6M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  pending: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8V12L15 15M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  star: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15L8.53299 17.2971C8.39139 17.3879 8.23059 17.4418 8.0641 17.4539C7.89761 17.466 7.73076 17.4357 7.57889 17.366C7.42702 17.2963 7.29498 17.1893 7.19508 17.0548C7.09518 16.9202 7.03076 16.7624 7.00799 16.5961L6.13199 11.8831L2.50799 8.42106C2.38684 8.30571 2.29505 8.16174 2.24072 8.00201C2.18639 7.84228 2.17117 7.67154 2.19648 7.50445C2.2218 7.33737 2.28698 7.17901 2.38638 7.04323C2.48577 6.90745 2.61662 6.79838 2.76699 6.72606L16.768 0.72606C16.9317 0.648379 17.1127 0.616134 17.2929 0.632746C17.473 0.649357 17.6459 0.714217 17.7951 0.820991C17.9442 0.927766 18.0644 1.07268 18.1438 1.24075C18.2232 1.40883 18.2591 1.59437 18.248 1.77906L17.248 17.7791C17.2378 17.9466 17.1875 18.109 17.1016 18.2523C17.0156 18.3955 16.8966 18.5153 16.7549 18.6012C16.6132 18.6871 16.453 18.7366 16.288 18.7454C16.123 18.7543 15.9584 18.7223 15.808 18.6521L12 17.0001" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

// Reusable components
const StatCard = ({ icon, title, value, intl }) => (
  <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
      <span dangerouslySetInnerHTML={{ __html: icon }} />
    </div>
    <div className="flex flex-col gap-1">
      <h2 className="text-sm text-menu font-medium">
        {intl.formatMessage({ id: title })}
      </h2>
      <h3 className="text-textPrimary font-semibold text-xl">{value}</h3>
    </div>
  </div>
);

const UserListCard = ({ title, users, viewAllLink, intl }) => (
  <div className="flex flex-col items-start justify-between gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full relative">
    <h4 className="text-lg text-textPrimary font-semibold">
      {intl.formatMessage({ id: title })}
    </h4>
    {users?.results && users?.results?.length > 0 ? (
      <>
        <div className="flex flex-col gap-5 min-h-[180px]">
          {users.results.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-buttonGrey">
                {item?.avatar ? (
                  <img
                    src={item?.center_avatar || item?.avatar}
                    loading="lazy"
                    role="img"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-menu text-lg">
                    {(item?.center_name || item?.full_name)?.[0]}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-[2px]">
                <h5 className="text-sm sm:text-base font-medium text-textPrimary">
                  {item?.center_name || item?.full_name}
                </h5>
                <p className="text-xs sm:text-sm text-textSecondary font-normal">
                  {formatDateToLong(item?.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href={viewAllLink}
          className="text-sm text-main text-end pt-5 hover:text-blue-800 transition-colors duration-200"
        >
          {intl.formatMessage({ id: "Wiew all" })}
        </Link>
      </>
    ) : (
      <p className="text-menu text-sm absolute top-16 left-2/4 -translate-x-2/4">
        {intl.formatMessage({ id: "There isn't anything" })}
      </p>
    )}
  </div>
);

const ProfileCard = ({ user_avatar, role, full_name, stats, intl }) => (
  <div className="flex flex-col items-center gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full">
    <div className="w-32 h-32 rounded-full overflow-hidden bg-menu flex items-center justify-center">
      {user_avatar ? (
        <img
          src={user_avatar}
          alt="user avatar"
          title="user avatar"
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-textPrimary text-xl">
          {full_name?.[0] || role?.[0]}
        </span>
      )}
    </div>
    <h6 className="text-lg text-textPrimary font-semibold">
      {full_name || role}
    </h6>
    <div className="flex items-center gap-7">
      {stats.map((stat, index) => (
        <div key={index} className="flex flex-col gap-1 items-center">
          <p className="text-sm text-menu">
            {intl.formatMessage({ id: stat.label })}
          </p>
          <p className="font-semibold text-textPrimary">{stat.value}</p>
        </div>
      ))}
    </div>
    <Link
      href={SETTINGS_URL}
      className="text-sm text-main text-end pt-5 hover:text-blue-800 transition-colors duration-200"
    >
      {intl.formatMessage({ id: "Settings" })}
    </Link>
  </div>
);

export const OwnerAnalytics = ({
  data,
  router,
  intl,
  user_avatar,
  role,
  full_name,
}) => {
  const { data: centers } = useSWR(
    ["/owner/centers/?page=1&page_size=3", router.locale],
    ([url, locale]) =>
      fetcher(
        url,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full">
        <StatCard
          icon={ICONS.building}
          title="Education Centers"
          value={data?.total_centers}
          intl={intl}
        />
        <StatCard
          icon={ICONS.building}
          title="Active Centers"
          value={data?.active_centers}
          intl={intl}
        />
        <StatCard
          icon={ICONS.users}
          title="Total Users"
          value={data?.total_users}
          intl={intl}
        />
        <StatCard
          icon={ICONS.users}
          title="Total Groups"
          value={data?.total_groups}
          intl={intl}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <UserListCard
          title="Education Centers"
          users={centers}
          viewAllLink={EDUCATIONCENTERS_URL}
          intl={intl}
        />
        <div className="hidden 2xl:block" />
        <ProfileCard
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
          stats={[
            { label: "Education Centers", value: centers?.count },
            { label: "Requests", value: centers?.count },
          ]}
          intl={intl}
        />
      </div>
    </>
  );
};

export const CenterAdminAnalytics = ({
  data,
  intl,
  router,
  user_avatar,
  role,
  full_name,
}) => {
  const { data: teachers } = useSWR(
    ["/users/?page=1&page_size=3&role=TEACHER", router.locale],
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const { data: students } = useSWR(
    ["/users/?page=1&page_size=3&role=STUDENT", router.locale],
    ([url, locale]) =>
      fetcher(
        url,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full">
        <StatCard
          icon={ICONS.users}
          title="Total Users"
          value={data?.total_students + data?.total_teachers}
          intl={intl}
        />
        <StatCard
          icon={ICONS.tasks}
          title="Active Exams"
          value={data?.active_exams}
          intl={intl}
        />
        <StatCard
          icon={ICONS.reviews}
          title="Pending Approvals"
          value={data?.pending_approvals}
          intl={intl}
        />
        <StatCard
          icon={ICONS.users}
          title="Total Groups"
          value={data?.total_groups}
          intl={intl}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <UserListCard
          title="Teachers"
          users={teachers}
          viewAllLink={`${USERS_URL}?role=TEACHER`}
          intl={intl}
        />
        <UserListCard
          title="Students"
          users={students}
          viewAllLink={`${USERS_URL}?role=STUDENT`}
          intl={intl}
        />
        <ProfileCard
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
          stats={[
            { label: "Teachers", value: teachers?.count },
            { label: "Students", value: students?.count },
          ]}
          intl={intl}
        />
      </div>
    </>
  );
};

// Teacher Analytics Component
export const TeacherAnalytics = ({
  data,
  intl,
  router,
  user_avatar,
  role,
  full_name,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full">
        <StatCard
          icon={ICONS.groups}
          title="My Groups"
          value={data?.my_groups_count || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.reviews}
          title="Pending Reviews"
          value={data?.pending_reviews_count || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.tasks}
          title="Average Class Score"
          value={
            data?.average_class_score
              ? Number(data.average_class_score).toFixed(1)
              : "0"
          }
          intl={intl}
        />
        <StatCard
          icon={ICONS.groups}
          title="Recent Submissions"
          value={data?.recent_submissions?.length || 0}
          intl={intl}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <ProfileCard
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
          stats={[
            {
              label: "My Groups",
              value: data?.my_groups_count || 0,
            },
            {
              label: "Pending Reviews",
              value: data?.pending_reviews_count || 0,
            },
          ]}
          intl={intl}
        />
      </div>
    </>
  );
};

// Assistant Analytics Component
export const AssistantAnalytics = ({
  data,
  intl,
  router,
  user_avatar,
  role,
  full_name,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full">
        <StatCard
          icon={ICONS.groups}
          title="Assigned Groups"
          value={data?.assigned_groups || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.groups}
          title="Total Students"
          value={data?.total_students || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.materials}
          title="Materials Created"
          value={data?.materials_created || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.tasks}
          title="Active Tasks"
          value={data?.active_tasks || 0}
          intl={intl}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
        <ProfileCard
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
          stats={[
            {
              label: "Groups",
              value: data?.assigned_groups || 0,
            },
            {
              label: "Materials",
              value: data?.materials_created || 0,
            },
          ]}
          intl={intl}
        />
        <div className="bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5">
          <h4 className="text-lg text-textPrimary font-semibold mb-4">
            {intl.formatMessage({ id: "Activity Overview" })}
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Materials Created" })}
              </p>
              <p className="text-lg font-semibold text-textPrimary">
                {data?.materials_created || 0}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Active Tasks" })}
              </p>
              <p className="text-lg font-semibold text-textPrimary">
                {data?.active_tasks || 0}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Students Assisted" })}
              </p>
              <p className="text-lg font-semibold text-textPrimary">
                {data?.total_students || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Student Analytics Component
export const StudentAnalytics = ({
  data,
  intl,
  router,
  user_avatar,
  role,
  full_name,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full">
        <StatCard
          icon={ICONS.completed}
          title="Completed Exams"
          value={data?.completed_exams || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.star}
          title="Average Band Score"
          value={
            data?.average_band_score
              ? Number(data.average_band_score).toFixed(1)
              : "0"
          }
          intl={intl}
        />
        <StatCard
          icon={ICONS.completed}
          title="Recent Results"
          value={data?.recent_results?.length || 0}
          intl={intl}
        />
        <StatCard
          icon={ICONS.pending}
          title="Upcoming Deadlines"
          value={data?.upcoming_deadlines?.length || 0}
          intl={intl}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <ProfileCard
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
          stats={[
            {
              label: "Completed Exams",
              value: data?.completed_exams || 0,
            },
            {
              label: "Average Band Score",
              value: data?.average_band_score
                ? Number(data.average_band_score).toFixed(1)
                : "0",
            },
          ]}
          intl={intl}
        />
      </div>
    </>
  );
};
