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

export default function MyResultsLists() {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();
  const { offcanvasClosed } = useOffcanvas();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;

  const { data: datas, isLoading } = useSWR(
    ["/my-reviews", router.locale, currentPage],
    ([url, locale, page]) =>
      fetcher(
        `${url}/?page=${page}&page_size=12`,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* {Array.from({ length: 12 }).map((_, i) => (
            <TaskItemSkeleton key={i} />
          ))} */}
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
              <MyResultItem data={item} key={item?.id} />
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
