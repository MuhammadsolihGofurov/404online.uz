import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { ExamItem } from "@/components/dashboard/details/items";
import EmptyState from "@/components/dashboard/empty-state";
import Pagination from "@/components/custom/pagination";
import fetcher from "@/utils/fetcher";
import { TaskItemSkeleton } from "@/components/skeleton";

export default function ExamList({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;

  const { data: datas, isLoading } = useSWR(
    ["/tasks/exams/", router.locale, currentPage],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}&page_size=9`,
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
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <TaskItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        {datas?.results?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datas?.results?.map((item) => (
              <ExamItem item={item} key={item?.id} role={role} />
            ))}
          </div>
        ) : (
          <EmptyState type="exams" />
        )}
      </div>

      {datas?.results?.length > 0 && (
        <Pagination count={datas?.count} pageSize={9} />
      )}
    </>
  );
}
