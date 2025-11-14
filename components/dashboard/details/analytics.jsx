import { AnalyticsSkeleton, EduCardsSkeleton } from "@/components/skeleton";
import {
  DASHBOARD_URL,
  EDUCATIONCENTERS_URL,
  SETTINGS_URL,
  TEACHERS_URL,
} from "@/mock/router";
import fetcher from "@/utils/fetcher";
import { formatDateToLong } from "@/utils/funcs";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function Analytics({ role, loading, user_avatar, full_name }) {
  const router = useRouter();
  const intl = useIntl();
  const request_url =
    role == "OWNER" ? "/analytics/owner/" : "/analytics/center/";

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

  if (role == "CENTER_ADMIN") {
    return (
      <>
        <CenterAdminAnalytics
          data={analytics}
          router={router}
          intl={intl}
          user_avatar={user_avatar}
          role={role}
          full_name={full_name}
        />
      </>
    );
  }

  return (
    <>
      <OwnerAnalytics
        data={analytics}
        router={router}
        intl={intl}
        user_avatar={user_avatar}
        role={role}
        full_name={full_name}
      />
    </>
  );
}

export const OwnerAnalytics = ({ data, router, intl, user_avatar, role }) => {
  const staticData = {
    total_centers: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H21M5 21V7L13 3V21M19 21V11L13 7M9 9V9.01M9 12V12.01M9 15V15.01M9 18V18.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                `,
      title: "Education Centers",
    },
    active_centers: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21H21M5 21V7L13 3V21M19 21V11L13 7M9 9V9.01M9 12V12.01M9 15V15.01M9 18V18.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            `,
      title: "Active Centers",
    },
    total_users: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      title: "Total Users",
    },
    total_groups: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      title: "Total Groups",
    },
  };

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
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_centers?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_centers?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_centers}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.active_centers?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.active_centers?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.active_centers}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_users?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_users?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_users}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_groups?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_groups?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_groups}
            </h3>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <div className="flex flex-col items-start justify-between gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full relative">
          <h4 className="text-lg text-textPrimary font-semibold">
            {intl.formatMessage({ id: "Education Centers" })}
          </h4>
          {centers?.results && centers?.results?.length > 0 ? (
            <>
              <div className="flex flex-col gap-5 min-h-[180px]">
                {/* bundan 3 tasi chiqariladi */}
                {centers?.results?.map((item, index) => {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-buttonGrey">
                        {item?.avatar ? (
                          <img
                            src={item?.center_avatar}
                            loading="lazy"
                            role="img"
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-menu text-lg">
                            {item?.center_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <h5 className="text-sm sm:text-base font-medium text-textPrimary">
                          {item?.center_name}
                        </h5>
                        <p className="text-xs sm:text-sm text-textSecondary font-normal">
                          {formatDateToLong(item?.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href={EDUCATIONCENTERS_URL}
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
        {/* bu yerda requests bo'ladi */}
        {/* bu yerda requests bo'ladi */}
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-menu">
            {user_avatar ? (
              <img
                src={user_avatar}
                alt="user avatar"
                title="user avatar"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-textPrimary text-xl">{role?.[0]}</span>
            )}
          </div>
          <h6 className="text-lg text-textPrimary">{role ?? role}</h6>
          <div className="flex items-center gap-7">
            <div className="flex flex-col gap-1 items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Education Centers" })}
              </p>
              <p>{centers?.count}</p>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Requests" })}
              </p>
              <p>{centers?.count}</p>
            </div>
          </div>
          <Link
            href={SETTINGS_URL}
            className="text-sm text-main text-end pt-5 hover:text-blue-800 transition-colors duration-200"
          >
            {intl.formatMessage({ id: "Settings" })}
          </Link>
        </div>
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
}) => {
  const staticData = {
    total_tasks: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 7H15M9 11H15M9 15H13M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
                `,
      title: "Total tasks",
    },
    total_submissions: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 6H7C6.46957 6 5.96086 6.21071 5.58579 6.58579C5.21071 6.96086 5 7.46957 5 8V17C5 17.5304 5.21071 18.0391 5.58579 18.4142C5.96086 18.7893 6.46957 19 7 19H16C16.5304 19 17.0391 18.7893 17.4142 18.4142C17.7893 18.0391 18 17.5304 18 17V14M20 7C20 8.65685 18.6569 10 17 10C15.3431 10 14 8.65685 14 7C14 5.34315 15.3431 4 17 4C18.6569 4 20 5.34315 20 7Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
            `,
      title: "Total submissions",
    },
    total_users: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      title: "Total Users",
    },
    total_groups: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      title: "Total Groups",
    },
  };

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
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_users?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_users?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_users}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_tasks?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_tasks?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_tasks}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_submissions?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_submissions?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_submissions}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-main-linear">
            <span
              dangerouslySetInnerHTML={{
                __html: staticData?.total_groups?.icon,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-menu font-medium">
              {intl.formatMessage({ id: staticData?.total_groups?.title })}
            </h2>
            <h3 className="text-textPrimary font-semibold text-xl">
              {data?.total_groups}
            </h3>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full">
        <div className="flex flex-col items-start justify-between gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full relative">
          <h4 className="text-lg text-textPrimary font-semibold">
            {intl.formatMessage({ id: "Teachers" })}
          </h4>
          {teachers?.results && teachers?.results?.length > 0 ? (
            <>
              <div className="flex flex-col gap-5 min-h-[180px]">
                {/* bundan 3 tasi chiqariladi */}
                {teachers?.results?.map((item, index) => {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-buttonGrey">
                        {item?.avatar ? (
                          <img
                            src={item?.center_avatar}
                            loading="lazy"
                            role="img"
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-menu text-lg">
                            {item?.full_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <h5 className="text-sm sm:text-base font-medium text-textPrimary">
                          {item?.full_name}
                        </h5>
                        <p className="text-xs sm:text-sm text-textSecondary font-normal">
                          {formatDateToLong(item?.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href={TEACHERS_URL}
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
        {/* students */}
        <div className="flex flex-col items-start justify-between gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full relative">
          <h4 className="text-lg text-textPrimary font-semibold">
            {intl.formatMessage({ id: "Students" })}
          </h4>
          {students?.results && students?.results?.length > 0 ? (
            <>
              <div className="flex flex-col gap-5 min-h-[180px]">
                {/* bundan 3 tasi chiqariladi */}
                {students?.results?.map((item, index) => {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-buttonGrey">
                        {item?.avatar ? (
                          <img
                            src={item?.center_avatar}
                            loading="lazy"
                            role="img"
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-menu text-lg">
                            {item?.full_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <h5 className="text-sm sm:text-base font-medium text-textPrimary">
                          {item?.full_name}
                        </h5>
                        <p className="text-xs sm:text-sm text-textSecondary font-normal">
                          {formatDateToLong(item?.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href={TEACHERS_URL}
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
        {/* avatar */}
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-menu">
            {user_avatar ? (
              <img
                src={user_avatar}
                alt="user avatar"
                title="user avatar"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-textPrimary text-xl">{role?.[0]}</span>
            )}
          </div>
          <h6 className="text-lg text-textPrimary">{role ?? role}</h6>
          <div className="flex items-center gap-7">
            <div className="flex flex-col gap-1 items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Teachers" })}
              </p>
              <p>{teachers?.count}</p>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <p className="text-sm text-menu">
                {intl.formatMessage({ id: "Students" })}
              </p>
              <p>{students?.count}</p>
            </div>
          </div>
          <Link
            href={SETTINGS_URL}
            className="text-sm text-main text-end pt-5 hover:text-blue-800 transition-colors duration-200"
          >
            {intl.formatMessage({ id: "Settings" })}
          </Link>
        </div>
      </div>
    </>
  );
};
