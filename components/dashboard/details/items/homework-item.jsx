import React from "react";
import { useIntl } from "react-intl";
import Link from "next/link";
import {
  Calendar,
  Award,
  CheckCircle,
  Clock,
  ChevronRight,
  FileText
} from "lucide-react";
import { formatDate } from "@/utils/funcs";

export default function HomeworkItem({ item, role }) {
  const intl = useIntl();

  const {
    id,
    title,
    description,
    due_date,
    submission_status,
    status,
    grade,
    items_count,
    created_at,
  } = item;

  const currentStatus = submission_status || status;
  const isGraded = currentStatus === "GRADED";
  const isSubmitted = currentStatus === "SUBMITTED";
  const isOverdue = due_date && new Date(due_date) < new Date() && !isGraded && !isSubmitted;

  // Status Configuration
  const getStatusConfig = () => {
    switch (currentStatus) {
      case "GRADED":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }),
          icon: Award,
        };
      case "SUBMITTED":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: intl.formatMessage({ id: "Submitted", defaultMessage: "Submitted" }),
          icon: CheckCircle,
        };
      case "DRAFT":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: intl.formatMessage({ id: "Draft", defaultMessage: "Draft" }),
          icon: FileText,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          label: intl.formatMessage({ id: "Not Started", defaultMessage: "Not Started" }),
          icon: null,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const linkHref = role === "STUDENT" ? `/dashboard/homeworks/${id}/take` : `/dashboard/homeworks/${id}`;

  return (
    <Link
      href={linkHref}
      className="group block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative gradient on hover */}
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col h-full">
        {/* Header: Date & Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.text}`}>
            {StatusIcon && <StatusIcon size={14} />}
            <span>{statusConfig.label}</span>
          </div>

          {due_date && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-bold" : "text-gray-500"}`}>
              <Clock size={14} />
              <span>{formatDate(due_date)}</span>
            </div>
          )}
        </div>

        {/* Content: Title & Description */}
        <div className="mb-6 flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {title}
          </h3>
          <div
            className="text-sm text-gray-500 line-clamp-2 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: description || intl.formatMessage({ id: "No description", defaultMessage: "No description provided" })
            }}
          />
        </div>

        {/* Footer: Metrics & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-4">
            {/* Grade Display */}
            {isGraded && grade !== null && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Grade</span>
                <span className="text-lg font-bold text-green-600">{grade}%</span>
              </div>
            )}

            {/* Task Count (if available) */}
            {items_count > 0 && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Tasks</span>
                <span className="text-sm font-semibold text-gray-700">{items_count}</span>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
