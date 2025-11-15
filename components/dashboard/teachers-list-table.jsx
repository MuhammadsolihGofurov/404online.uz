import fetcher from "@/utils/fetcher";
import { formatDateToShort } from "@/utils/funcs";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { CentersTableSkeleton } from "../skeleton";
import Pagination from "../custom/pagination";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";
import { EduCenterItem } from "./details";
import { TeacherListItem } from "./details/center-admin";

export default function TeachersListTable({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentPage = parseInt(findParams("page")) || 1;

  const { data: teachers, isLoading } = useSWR(
    ["/users/", router.locale, currentPage, modalClosed],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}&page_size=10&role=TEACHER`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (loading || isLoading) {
    return <CentersTableSkeleton />;
  }
  return (
    <>
      <div className="bg-white rounded-2xl overflow-x-auto sm:w-full">
        <table className="w-[700px] sm:w-full text-textPrimary rounded-2xl">
          <thead>
            <tr className="border-b border-dashboard-bg">
              <th className="text-sm font-bold text-center p-4 w-[5%]">№</th>
              <th className="text-sm font-bold p-4 w-[30%] text-start">
                {intl.formatMessage({ id: "Name" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Students" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Groups" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Status" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Date" })}
              </th>
              <th className="text-sm font-bold p-4 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {teachers && teachers?.results?.length > 0 ? (
              teachers?.results?.map((item, index) => {
                return (
                  <TeacherListItem
                    key={index}
                    item={item}
                    isExists={teachers?.results?.length}
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-6 text-sm text-textSecondary">
                  {intl.formatMessage({ id: "There isn't anything" })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination count={teachers?.count} />
    </>
  );
}
