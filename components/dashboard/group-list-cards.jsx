import { useModal } from "@/context/modal-context";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import { GroupListItem } from "./details/items";
import { useParams } from "@/hooks/useParams";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { CentersTableSkeleton, GroupListSkeleton } from "../skeleton";
import Pagination from "../custom/pagination";
import GroupListItemSkeleton from "../skeleton/groups/group-list-item-skeleton";

export default function GroupListCards({ loading, role }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentPage = parseInt(findParams("page")) || 1;

  // query
  const query = `&page_size=12`;

  const { data: datas, isLoading } = useSWR(
    ["/groups/", router.locale, currentPage, modalClosed],
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
    return <GroupListSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 p-5 sm:p-6">
        {datas?.results?.map((item, index) => {
          return <GroupListItem key={index} item={item} role={role}/>;
        })}
      </div>

      <Pagination count={datas?.count} />
    </>
  );
}
