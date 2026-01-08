import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { SectionItem, TaskItem } from "../details/items";
import Pagination from "@/components/custom/pagination";
import fetcher from "@/utils/fetcher";
import { SectionSkeleton, TaskItemSkeleton } from "@/components/skeleton";
import { useModal } from "@/context/modal-context";

export default function SectionLists({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;
  const currentMockType = findParams("section") || "listening";
  const searchTerms = findParams("search") || "";

  const apiUrl =
    currentMockType === "quiz" ? "/quizzes/" : `/mocks/${currentMockType}`;

  const { data: datas, isLoading } = useSWR(
    [apiUrl, router.locale, currentPage, searchTerms, modalClosed],
    ([url, locale, page, terms]) =>
      fetcher(
        `${url}?search=${terms}&page=${page}&page_size=8`,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SectionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {datas?.results?.length > 0 ? (
            datas?.results?.map((item) => (
              <SectionItem data={item} key={item?.id} />
            ))
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({ id: "There isn't anything" })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} pageSize={8} />
    </>
  );
}
