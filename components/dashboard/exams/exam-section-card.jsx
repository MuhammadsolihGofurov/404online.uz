import React from "react";
import { Loader, CheckCircle, Clock, Award } from "lucide-react";

export default function ExamSectionCard({
  title,
  duration,
  status = "NOT_STARTED",
  onClick,
  isLoading = false,
  isCompleted = false,
  bandScore = null,
}) {
  const durationValue = Number.isFinite(duration) ? duration : null;

  const statusConfig = {
    NOT_STARTED: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: "Not Started",
    },
    IN_PROGRESS: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "In Progress",
    },
    STARTED: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "In Progress",
    },
    SUBMITTED: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Submitted",
    },
    GRADED: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Graded",
    },
  };

  const statusStyle = statusConfig[status] || statusConfig.NOT_STARTED;

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isCompleted}
      className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

      <div className="flex items-center gap-2 mb-4 text-gray-600 text-sm">
        <Clock className="w-4 h-4" />
        <span>
          {durationValue !== null ? durationValue : "—"}{" "}
          {durationValue === 1 ? "minute" : "minutes"}
        </span>
      </div>

      {bandScore && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <Award className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-xs text-gray-600">Band Score</div>
            <div className="text-lg font-bold text-blue-600">{bandScore}</div>
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${statusStyle.bg} ${statusStyle.text}`}
      >
        {(status === "GRADED" || status === "SUBMITTED") && (
          <CheckCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-semibold">{statusStyle.label}</span>
      </div>
    </button>
  );
}
