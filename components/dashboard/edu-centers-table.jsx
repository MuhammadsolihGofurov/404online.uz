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

export default function EduCenterTable({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentPage = parseInt(findParams("page")) || 1;

  const { data: centers, isLoading } = useSWR(
    ["/owner/centers/", router.locale, currentPage, modalClosed],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}&page_size=10`,
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
                {intl.formatMessage({ id: "Users" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Admins" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Teacher’s count" })}
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
            {centers?.results?.map((item, index) => {
              return <EduCenterItem key={index} item={item} />;
            })}
          </tbody>
        </table>
      </div>

      <Pagination count={centers?.count} />
    </>
  );
}
