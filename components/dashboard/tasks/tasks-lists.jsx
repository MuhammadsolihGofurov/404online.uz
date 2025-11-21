import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { TaskItem } from "../details/items";
import Pagination from "@/components/custom/pagination";
import fetcher from "@/utils/fetcher";
import { TaskItemSkeleton } from "@/components/skeleton";
import { TasksFilter } from "../details/filters";

export default function TasksLists({ role, loading, user_id }) {
  const router = useRouter();
  const intl = useIntl();
  const { modalClosed } = useModal();

  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;

  // Filter state management
  const [filters, setFilters] = useState({});

  const { data: datas, isLoading } = useSWR(
    [
      "/tasks/",
      router.locale,
      currentPage,
      modalClosed,
      filters.task_type,
      filters.assigned_group,
      filters.assigned_student,
    ],
    ([url, locale, page]) => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("page_size", "12");

      if (filters.task_type) {
        queryParams.append("task_type", filters.task_type);
      }
      if (filters.assigned_group) {
        queryParams.append("assigned_group", filters.assigned_group);
      }
      if (filters.assigned_student) {
        queryParams.append("assigned_student", filters.assigned_student);
      }

      return fetcher(
        `${url}?${queryParams.toString()}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      );
    }
  );

  if (loading || isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <TaskItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tasks Filter */}
      <TasksFilter filter={filters} setFilter={setFilters} />

      <div className="bg-white rounded-2xl p-5 sm:p-6 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {datas?.results?.length > 0 ? (
            datas?.results?.map((item) => (
              <TaskItem item={item} key={item?.id} role={role} user_id={user_id} />
            ))
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({ id: "There isn't anything" })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} pageSize={12} />
    </>
  );
}
