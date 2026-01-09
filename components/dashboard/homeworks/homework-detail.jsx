import React from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { formatDate } from "@/utils/funcs";
import {
  FileText,
  Clock,
  Users,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  List,
} from "lucide-react";
import HomeworkItemsList from "./homework-items-list";

export default function HomeworkDetail({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { id } = router.query;

  const {
    data: homework,
    isLoading,
    error,
  } = useSWR(
    id ? [`/tasks/homeworks/${id}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
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
      <div className="bg-white rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <p className="text-red-500 text-center">
          {intl.formatMessage({
            id: "Error loading homework",
            defaultMessage: "Error loading homework",
          })}
        </p>
      </div>
    );
  }

  if (!homework) return null;

  // Normalize API fields for UI
  const items = homework.items || homework.homework_items || [];
  const assignedGroups = homework.assigned_groups || [];
  const assignedUsers = homework.assigned_users || [];
  const deadline = homework.deadline || homework.due_date;

  // Show "Take Homework" button for students if not graded/submitted
  const showTakeButton =
    role === "STUDENT" &&
    ["PENDING", "DRAFT", undefined, null].includes(homework.status);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: intl.formatMessage({
            id: "Pending",
            defaultMessage: "Pending",
          }),
          class: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        };
      case "GRADED":
        return {
          label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }),
          class: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
        };
      case "PUBLISHED":
        return {
          label: intl.formatMessage({
            id: "Published",
            defaultMessage: "Published",
          }),
          class: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      default:
        return {
          label: status,
          class: "bg-gray-100 text-gray-800",
          icon: FileText,
        };
    }
  };

  const statusInfo = getStatusBadge(homework.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Take Homework Button */}
      {showTakeButton && (
        <div className="flex justify-end mb-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => router.push(`/dashboard/homeworks/${homework.id}/take`)}
          >
            {intl.formatMessage({ id: "Take Homework", defaultMessage: "Take Homework" })}
          </button>
        </div>
      )}
      {/* Fallback for empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <h2 className="text-2xl font-bold text-gray-400 mb-2">{intl.formatMessage({ id: "No homework items", defaultMessage: "No homework items" })}</h2>
        </div>
      )}
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {homework.title}
            </h1>
            {homework.description && (
              <div
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: homework.description }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <StatusIcon size={20} className={statusInfo.class.split(" ")[1]} />
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {intl.formatMessage({
                  id: "Created by",
                  defaultMessage: "Created by",
                })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {homework.created_by_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {intl.formatMessage({
                  id: "Assigned Groups",
                  defaultMessage: "Assigned Groups",
                })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {assignedGroups.length} {intl.formatMessage({ id: "groups", defaultMessage: "groups" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {intl.formatMessage({
                  id: "Created Date",
                  defaultMessage: "Created",
                })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(homework.created_at)}
              </p>
            </div>
          </div>
        </div>
        {deadline && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center gap-2">
            <Clock size={18} className="text-orange-600" />
            <span className="text-sm text-orange-900">
              {intl.formatMessage({
                id: "Due Date",
                defaultMessage: "Due Date",
              })}
              : {formatDate(deadline)}
            </span>
          </div>
        )}
      </div>

      {/* Homework Items Section */}
      <HomeworkItemsList items={items} />
      {/* Assigned Users Section */}
      {assignedUsers.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} />
            {intl.formatMessage({
              id: "Individually Assigned",
              defaultMessage: "Individually Assigned",
            })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <User size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || user.username}
                  </p>
                  {user.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publishing Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg ${homework.is_published ? "bg-green-50" : "bg-gray-50"
              } flex items-center justify-center`}
          >
            {homework.is_published ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <XCircle size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {homework.is_published
                ? intl.formatMessage({
                  id: "Published",
                  defaultMessage: "Published",
                })
                : intl.formatMessage({
                  id: "Not Published",
                  defaultMessage: "Not Published",
                })}
            </p>
            <p className="text-xs text-gray-500">
              {homework.is_published
                ? intl.formatMessage({
                  id: "Scores are visible to students",
                  defaultMessage: "Scores are visible to students",
                })
                : intl.formatMessage({
                  id: "Scores are hidden from students",
                  defaultMessage: "Scores are hidden from students",
                })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
