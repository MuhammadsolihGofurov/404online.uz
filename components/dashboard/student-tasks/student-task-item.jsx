import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { Calendar, Clock, CheckCircle, Circle, PlayCircle } from "lucide-react";
import { formatDate } from "@/utils/funcs";

export default function StudentTaskItem({ item, user }) {
  const intl = useIntl();

  const {
    id,
    title,
    task_type,
    deadline,
    duration_minutes,
    submission_status,
    can_start,
    created_at,
  } = item;

  // Helper to format Task Type
  const formatType = (type) => {
    return type
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper for Badge Colors based on Task Type
  const getTypeColor = (type) => {
    switch (type) {
      case "EXAM_MOCK":
      case "EXAM":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "CUSTOM_MOCK":
      case "HOMEWORK":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  // Get submission status badge
  const getStatusBadge = () => {
    switch (submission_status) {
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
            <CheckCircle size={12} />
            {intl.formatMessage({ id: "Completed" })}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
            <PlayCircle size={12} />
            {intl.formatMessage({ id: "In Progress" })}
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
            <Circle size={12} />
            {intl.formatMessage({ id: "Not Started" })}
          </span>
        );
    }
  };

  // Check if deadline is passed
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  // Determine if the task can be started
  const canStartTask = can_start && !isExpired;

  return (
    <Link
      href={canStartTask ? `/dashboard/student-tasks/${id}` : "#"}
      className={`group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 ${
        canStartTask
          ? "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
          : "cursor-not-allowed opacity-60"
      }`}
      onClick={(e) => {
        if (!canStartTask) {
          e.preventDefault();
        }
      }}
    >
      {/* --- Header: Badges & Status --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {/* Type Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getTypeColor(
              task_type
            )}`}
          >
            {formatType(task_type)}
          </span>
        </div>

        {/* Status Badge */}
        <div>{getStatusBadge()}</div>
      </div>

      {/* --- Body: Title & Meta --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        <div className="space-y-2.5">
          {/* Deadline */}
          <div
            className={`flex items-center gap-2 text-sm ${
              isExpired ? "text-red-500" : "text-gray-500"
            }`}
          >
            <Calendar size={16} className="shrink-0" />
            <span>
              {deadline ? (
                intl.formatDate(deadline, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              ) : (
                <span className="italic text-gray-400">No deadline</span>
              )}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} className="shrink-0" />
            <span>
              {duration_minutes > 0
                ? `${Math.floor(duration_minutes / 60)}h ${
                    duration_minutes % 60
                  }m`
                : "No time limit"}
            </span>
          </div>
        </div>
      </div>

      {/* --- Footer: Created Date --- */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(created_at)}</span>
        {canStartTask && (
          <span className="text-xs text-primary font-medium">
            {intl.formatMessage({ id: "Start" })} →
          </span>
        )}
      </div>

      {/* Decoration Gradient on Hover */}
      {canStartTask && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
      )}
    </Link>
  );
}
