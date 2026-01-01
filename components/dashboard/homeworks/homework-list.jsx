import React, { useState } from "react";
import HomeworkListItem from "./homework-list-item";
import { useHomeworkResults } from "@/hooks/useHomeworkResults";
import { BannerSkeleton } from "@/components/skeleton";
import { useIntl } from "react-intl";
import Pagination from "@/components/custom/pagination";
import { useParams } from "@/hooks/useParams";

export default function HomeworkList() {
  const intl = useIntl();
  const { findParams } = useParams();

  const currentPage = parseInt(findParams("page") || "1");

  const { data, count, isLoading, isError } = useHomeworkResults({
    page: currentPage,
    page_size: 12,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <BannerSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <p className="text-sm text-center text-red-500">
          {intl.formatMessage({
            id: "Error loading homeworks",
            defaultMessage: "Error loading homeworks",
          })}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        {/* Homework List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.length > 0 ? (
            data.map((item) => <HomeworkListItem key={item?.id} item={item} />)
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({
                id: "No homeworks found",
                defaultMessage: "No homeworks found",
              })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={count} pageSize={12} />
    </>
  );
}
