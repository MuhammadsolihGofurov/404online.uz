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
  Headphones,
  BookOpen,
  PenTool,
} from "lucide-react";

export default function ExamDetail({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { id } = router.query;

  const {
    data: exam,
    isLoading,
    error,
  } = useSWR(
    id ? [`/tasks/exams/${id}/`, router.locale] : null,
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
            id: "Error loading exam",
            defaultMessage: "Error loading exam",
          })}
        </p>
      </div>
    );
  }

  if (!exam) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return {
          label: intl.formatMessage({ id: "Open", defaultMessage: "Open" }),
          class: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case "CLOSED":
        return {
          label: intl.formatMessage({ id: "Closed", defaultMessage: "Closed" }),
          class: "bg-red-100 text-red-800",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          class: "bg-gray-100 text-gray-800",
          icon: FileText,
        };
    }
  };

  const statusInfo = getStatusBadge(exam.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
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
                {exam.created_by_name}
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
                {exam.assigned_groups_count || 0}{" "}
                {intl.formatMessage({ id: "groups", defaultMessage: "groups" })}
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
                {formatDate(exam.created_at)}
              </p>
            </div>
          </div>
        </div>

        {exam.estimated_start_time && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <span className="text-sm text-blue-900">
              {intl.formatMessage({
                id: "Estimated Start",
                defaultMessage: "Estimated Start",
              })}
              : {formatDate(exam.estimated_start_time)}
            </span>
          </div>
        )}
      </div>

      {/* Mock Tests Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {intl.formatMessage({
            id: "Mock Tests",
            defaultMessage: "Mock Tests",
          })}
        </h2>

        <div className="space-y-3">
          {/* Listening Mock */}
          {exam.listening_mock && (
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Headphones size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                  {intl.formatMessage({
                    id: "Listening",
                    defaultMessage: "Listening",
                  })}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {exam.listening_mock_title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {exam.listening_mock}
                </p>
              </div>
            </div>
          )}

          {/* Reading Mock */}
          {exam.reading_mock && (
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                  {intl.formatMessage({
                    id: "Reading",
                    defaultMessage: "Reading",
                  })}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {exam.reading_mock_title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {exam.reading_mock}
                </p>
              </div>
            </div>
          )}

          {/* Writing Mock */}
          {exam.writing_mock && (
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <PenTool size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                  {intl.formatMessage({
                    id: "Writing",
                    defaultMessage: "Writing",
                  })}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {exam.writing_mock_title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {exam.writing_mock}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publishing Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg ${
              exam.is_published ? "bg-green-50" : "bg-gray-50"
            } flex items-center justify-center`}
          >
            {exam.is_published ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <XCircle size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {exam.is_published
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
              {exam.is_published
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
