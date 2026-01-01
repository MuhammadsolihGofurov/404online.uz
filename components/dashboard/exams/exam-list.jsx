import React, { useState } from "react";
import ExamListItem from "./exam-list-item";
import { useExamResults } from "@/hooks/useExamResults";
import { BannerSkeleton } from "@/components/skeleton";
import { useIntl } from "react-intl";
import Pagination from "@/components/custom/pagination";
import { useParams } from "@/hooks/useParams";

export default function ExamList() {
  const intl = useIntl();
  const { findParams, updateParams } = useParams();

  const currentPage = parseInt(findParams("page") || "1");
  const [isGradedFilter, setIsGradedFilter] = useState("");
  const [isPublishedFilter, setIsPublishedFilter] = useState("");

  const { data, count, isLoading, isError } = useExamResults({
    is_graded: isGradedFilter !== "" ? isGradedFilter === "true" : undefined,
    is_published:
      isPublishedFilter !== "" ? isPublishedFilter === "true" : undefined,
    page: currentPage,
    page_size: 12,
  });

  const handleFilterChange = (filterType, value) => {
    if (filterType === "graded") {
      setIsGradedFilter(value);
    } else if (filterType === "published") {
      setIsPublishedFilter(value);
    }
    updateParams("page", "1"); // Reset to page 1 when filtering
  };

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
            id: "Error loading exams",
            defaultMessage: "Error loading exams",
          })}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={isGradedFilter}
            onChange={(e) => handleFilterChange("graded", e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
          >
            <option value="">
              {intl.formatMessage({
                id: "All Status",
                defaultMessage: "All Status",
              })}
            </option>
            <option value="false">
              {intl.formatMessage({ id: "Pending", defaultMessage: "Pending" })}
            </option>
            <option value="true">
              {intl.formatMessage({ id: "Graded", defaultMessage: "Graded" })}
            </option>
          </select>

          <select
            value={isPublishedFilter}
            onChange={(e) => handleFilterChange("published", e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
          >
            <option value="">
              {intl.formatMessage({
                id: "All Published",
                defaultMessage: "All Published",
              })}
            </option>
            <option value="true">
              {intl.formatMessage({
                id: "Published",
                defaultMessage: "Published",
              })}
            </option>
            <option value="false">
              {intl.formatMessage({
                id: "Not Published",
                defaultMessage: "Not Published",
              })}
            </option>
          </select>
        </div>

        {/* Exam List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.length > 0 ? (
            data.map((item) => <ExamListItem key={item?.id} item={item} />)
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({
                id: "No exams found",
                defaultMessage: "No exams found",
              })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={count} pageSize={12} />
    </>
  );
}
