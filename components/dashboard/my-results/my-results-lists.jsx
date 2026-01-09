import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { MyResultItem } from "../details/items";
import Pagination from "@/components/custom/pagination";
import { MyResultItemSkeleton } from "@/components/skeleton";

export default function MyResultsLists({ role }) {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();
  const { offcanvasClosed } = useOffcanvas();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;
  const type = findParams("type");
  const currentType = type == "EXAM" ? "exam_task_id" : "homework_task_id";
  const currentTypeId = findParams("task_id");

  const { data: datas, isLoading } = useSWR(
    [
      "/my-results",
      router.locale,
      type,
      currentPage,
      currentType,
      currentTypeId,
    ],
    ([url, locale, tp, page, t, tId]) =>
      fetcher(
        `${url}?type=${tp}&page=${page}${
          tId ? `&${t}=${tId}` : ""
        }&page_size=12`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MyResultItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-5">
          {datas?.results?.length > 0 ? (
            datas?.results?.map((item) => (
              <MyResultItem data={item} key={item?.id} role={role} />
            ))
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 text-textSecondary">
              {intl.formatMessage({ id: "There isn't anything" })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} pageSize={12} />
    </>
  );
}
