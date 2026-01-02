import React from "react";
import { useIntl } from "react-intl";
import Link from "next/link";
import { FileText, Calendar, Award, AlertCircle } from "lucide-react";
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
    feedback,
    created_at,
  } = item;

  const currentStatus = submission_status || status;

  const getStatusInfo = () => {
    switch (currentStatus) {
      case "DRAFT":
        return {
          label: intl.formatMessage({ id: "Draft", defaultMessage: "Draft" }),
          class: "bg-gray-50 text-gray-700 border-gray-100",
          icon: FileText,
        };
      case "SUBMITTED":
        return {
          label: intl.formatMessage({
            id: "Submitted",
            defaultMessage: "Submitted",
          }),
          class: "bg-blue-50 text-blue-700 border-blue-100",
          icon: FileText,
        };
      case "GRADED":
        return {
          label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }),
          class: "bg-green-50 text-green-700 border-green-100",
          icon: Award,
        };
      default:
        return {
          label: intl.formatMessage({
            id: "Pending",
            defaultMessage: "Pending",
          }),
          class: "bg-yellow-50 text-yellow-700 border-yellow-100",
          icon: AlertCircle,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isOverdue =
    due_date && new Date(due_date) < new Date() && currentStatus !== "GRADED";

  return (
    <Link
      href={`/dashboard/homeworks/${id}`}
      className="group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
    >
      {/* Header: Title & Status */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {title ||
              intl.formatMessage({
                id: "Homework",
                defaultMessage: "Homework",
              })}
          </h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.class} ml-2 shrink-0`}
          >
            {statusInfo.label}
          </span>
        </div>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Body: Meta Information */}
      <div className="space-y-2.5 mb-4">
        {/* Grade */}
        {grade !== null && grade !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Award size={16} className="text-green-500 shrink-0" />
            <span className="font-semibold">
              {intl.formatMessage({ id: "Grade", defaultMessage: "Grade" })}:
            </span>
            <span className="font-bold text-primary">{grade}</span>
          </div>
        )}

        {/* Due Date */}
        {due_date && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isOverdue ? "text-red-500" : "text-gray-500"
            }`}
          >
            <Calendar size={16} className="shrink-0" />
            <span>
              {intl.formatMessage({ id: "Due Date", defaultMessage: "Due" })}:{" "}
              {formatDate(due_date)}
            </span>
            {isOverdue && <AlertCircle size={14} className="animate-pulse" />}
          </div>
        )}
      </div>

      {/* Footer: Feedback */}
      {feedback && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">
            {intl.formatMessage({ id: "Feedback", defaultMessage: "Feedback" })}
            :
          </p>
          <p className="text-sm text-gray-700 italic line-clamp-2">
            "{feedback}"
          </p>
        </div>
      )}

      {/* Decoration Gradient on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
    </Link>
  );
}
