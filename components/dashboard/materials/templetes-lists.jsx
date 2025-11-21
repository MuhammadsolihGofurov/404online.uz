import Pagination from "@/components/custom/pagination";
import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import DocumentItem from "../details/items/document-item";
import { useIntl } from "react-intl";
import {
  DocumentItemSkeleton,
  TemplateItemSkeleton,
} from "@/components/skeleton";
import { TemplateItem } from "../details/items";

export default function TempletesLists({ loading, role, user_id }) {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;

  const { data: datas, isLoading } = useSWR(
    ["/material-templates/", router.locale, currentPage, modalClosed],
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
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bg-white rounded-2xl p-5 sm:p-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <TemplateItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {datas?.results?.length > 0 ? (
            datas?.results?.map((doc) => (
              <TemplateItem
                key={doc.id}
                item={doc}
                role={role}
                user_id={user_id}
              />
            ))
          ) : (
            <p>{intl.formatMessage({ id: "There isn't anything" })}</p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} />
    </>
  );
}
