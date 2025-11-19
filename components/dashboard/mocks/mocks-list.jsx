import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { useParams } from "@/hooks/useParams";
import Pagination from "@/components/custom/pagination";
import { MockListItem } from "./details";
import { MocksFilter } from "../details/filters";
import { MockListItemSkeleton } from "@/components/skeleton";

export default function MocksList({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();

  const currentPage = parseInt(findParams("page")) || 1;
  const currentCategory = findParams("category");
  const currentMockType = findParams("mock_type");

  // query
  const query = `&page_size=12${
    currentCategory ? `&category=` + currentCategory : ""
  }${currentMockType ? `&mock_type=${currentMockType}` : ""}`;

  const { data: datas, isLoading } = useSWR(
    ["/mocks/", router.locale, currentPage, currentCategory, currentMockType],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}${query}`,
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
      <>
        <MocksFilter />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 bg-white rounded-2xl w-full p-5 sm:p-6">
          {[...Array(12)].map((_, i) => (
            <MockListItemSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <MocksFilter />

      <div className="bg-white rounded-2xl w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-5 sm:p-6 gap-5">
        {datas && datas?.results?.length > 0 ? (
          datas?.results?.map((item, index) => {
            return <MockListItem index={index} item={item} key={index} />;
          })
        ) : (
          <p className="text-center p-6 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 text-sm text-textSecondary">
            {intl.formatMessage({ id: "There isn't anything" })}
          </p>
        )}
      </div>

      <Pagination count={datas?.count} />
    </>
  );
}
