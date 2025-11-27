import { useRouter } from "next/router";
import React, { useState, useMemo } from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { StudentTaskCard } from "./student-task-card";
import { TaskItemSkeleton } from "@/components/skeleton";
import { authAxios } from "@/utils/axios";

export function MyTasksList({ loading, user_id }) {
  const router = useRouter();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState("todo"); // "todo" or "completed"
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch all tasks (backend already filters for current student)
  const { data: tasksData, isLoading, mutate } = useSWR(
    ["/tasks/", router.locale, activeTab, page],
    ([url, locale, _, p]) =>
      fetcher(
        `${url}?page=${p}&page_size=${pageSize}&exclude_task_type=EXAM_MOCK`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Fetch submissions to determine task status
  const { data: submissionsData } = useSWR(
    user_id ? ["/submissions/", router.locale, user_id] : null,
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Parse submissions data - handle both flat array and paginated response
  const submissions = useMemo(() => {
    if (!submissionsData) return [];
    // Handle both flat array and paginated object
    return Array.isArray(submissionsData) ? submissionsData : submissionsData?.results || [];
  }, [submissionsData]);

  // Create a map of task_id -> submission for quick lookup
  const submissionsMap = useMemo(() => {
    if (!submissions || submissions.length === 0) return {};
    const map = {};
    submissions.forEach((sub) => {
      // Handle both task as object with id, or task as direct id
      const taskId = typeof sub.task === "object" ? sub.task?.id : sub.task;
      if (taskId) {
        // Keep the latest submission for each task (in case of multiple)
        if (!map[taskId] || new Date(sub.created_at) > new Date(map[taskId].created_at)) {
          map[taskId] = sub;
        }
      }
    });
    return map;
  }, [submissions]);

  // Parse tasks data - handle both flat array and paginated response
  const tasks = useMemo(() => {
    if (!tasksData) return [];
    // Handle both flat array and paginated object
    return Array.isArray(tasksData) ? tasksData : tasksData?.results || [];
  }, [tasksData]);

  // Categorize tasks
  const { todoTasks, completedTasks } = useMemo(() => {
    if (!tasks || tasks.length === 0) return { todoTasks: [], completedTasks: [] };

    const todo = [];
    const completed = [];

    tasks.forEach((task) => {
      const submission = submissionsMap[task.id];
      const status = submission?.status;

      // Completed: PENDING, APPROVED, or REJECTED (final submission states)
      // Note: RESUBMISSION is moved back to "To Do" as it requires action
      if (
        status === "PENDING" ||
        status === "APPROVED" ||
        status === "REJECTED"
      ) {
        completed.push({ ...task, submission });
      } else {
        // To Do: DRAFT, RESUBMISSION, or no submission
        // Include ALL tasks regardless of deadline - expired tasks stay in "To Do" with badge
        todo.push({ ...task, submission });
      }
    });

    return { todoTasks: todo, completedTasks: completed };
  }, [tasks, submissionsMap]);

  const currentTasks = activeTab === "todo" ? todoTasks : completedTasks;
  const totalCount = tasksData?.count || 0;
  const hasNextPage = !!tasksData?.next;
  const hasPrevPage = !!tasksData?.previous;

  if (loading || isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="bg-white w-full rounded-2xl p-5 flex items-center gap-5 mb-5">
        <p className="text-textPrimary text-sm font-semibold">
          {intl.formatMessage({ id: "Status" })}:
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={`px-4 py-2 rounded-xl border text-sm transition-colors duration-150 ${
              activeTab === "todo"
                ? "bg-main text-white border-main"
                : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
            }`}
          >
            {intl.formatMessage({ id: "To Do" })}
            {todoTasks.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {todoTasks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl border text-sm transition-colors duration-150 ${
              activeTab === "completed"
                ? "bg-main text-white border-main"
                : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
            }`}
          >
            {intl.formatMessage({ id: "Completed" })}
            {completedTasks.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {completedTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        {currentTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentTasks.map((task) => (
              <StudentTaskCard
                key={task.id}
                task={task}
                submission={task.submission}
                onRefresh={mutate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-textSecondary">
              {intl.formatMessage({
                id:
                  activeTab === "todo"
                    ? "No tasks to do"
                    : "No completed tasks",
              })}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {(hasNextPage || hasPrevPage) && (
          <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {intl.formatMessage({ id: "Previous" })}
            </button>
            <span className="text-sm text-gray-600">
              {intl.formatMessage({ id: "Page" })} {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {intl.formatMessage({ id: "Next" })}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

