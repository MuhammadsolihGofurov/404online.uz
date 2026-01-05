import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { Clock, Calendar, BarChart3 } from "lucide-react";
import { formatDate } from "@/utils/funcs";

export default function ExamItem({ item, role }) {
  const intl = useIntl();

  const { id, title, status, created_at } = item;

  const getStatusConfig = () => {
    if (status === "OPEN") {
      return {
        label: intl.formatMessage({ id: "Open", defaultMessage: "Open" }),
        class: "bg-green-50 text-green-700 border-green-200",
        dotColor: "bg-green-500",
      };
    }
    if (status === "CLOSED") {
      return {
        label: intl.formatMessage({ id: "Closed", defaultMessage: "Closed" }),
        class: "bg-gray-50 text-gray-600 border-gray-200",
        dotColor: "bg-gray-400",
      };
    }
    return {
      label: intl.formatMessage({ id: "Draft", defaultMessage: "Draft" }),
      class: "bg-yellow-50 text-yellow-700 border-yellow-200",
      dotColor: "bg-yellow-500",
    };
  };

  const statusConfig = getStatusConfig();

  // Students go directly to task taking page, others go to details page
  const taskUrl =
    role === "STUDENT"
      ? `/dashboard/tasks/exams/${id}/take`
      : `/dashboard/exams/${id}`;

  return (
    <Link
      href={taskUrl}
      className="group relative flex flex-col bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] overflow-hidden"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusConfig.class}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} animate-pulse`}
          />
          {statusConfig.label}
        </span>
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <BarChart3 size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
        {title ||
          intl.formatMessage({
            id: "Exam Task",
            defaultMessage: "Exam Task",
          })}
      </h3>

      {/* Info Grid */}
      <div className="space-y-3 mt-auto">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <Calendar size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">
              {intl.formatMessage({ id: "Created", defaultMessage: "Created" })}
            </span>
            <span className="font-semibold text-gray-900">
              {formatDate(created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom gradient decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
}
