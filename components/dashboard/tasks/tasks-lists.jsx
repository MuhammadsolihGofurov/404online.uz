import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { TaskItem } from "../details/items";
import Pagination from "@/components/custom/pagination";
import fetcher from "@/utils/fetcher";

export default function TasksLists({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;

  const { data: datas, isLoading } = useSWR(
    ["/tasks/", router.locale, currentPage, modalClosed],
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
    // bu yerda skeleton bo'ladi alohida compontentda
    return <></>;
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {datas?.results?.length > 0 ? (
            datas?.results?.map((item) => (
              <TaskItem item={item} key={item?.id} role={role} />
            ))
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({ id: "There isn't anything" })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} />
    </>
  );
}
