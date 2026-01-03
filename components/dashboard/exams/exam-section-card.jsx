import React from "react";
import { Loader, CheckCircle, Clock } from "lucide-react";

export default function ExamSectionCard({
  title,
  duration,
  answered,
  total,
  onClick,
  isLoading = false,
}) {
  const percentage = total > 0 ? (answered / total) * 100 : 0;
  const durationValue = Number.isFinite(duration) ? duration : null;

  const getStatus = () => {
    if (answered === 0) return "not-started";
    if (answered === total) return "completed";
    return "in-progress";
  };

  const status = getStatus();

  const statusConfig = {
    "not-started": {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: "Not Started",
    },
    "in-progress": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "In Progress",
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Completed",
    },
  };

  const statusStyle = statusConfig[status];

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
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

      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
            {answered}/{total}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${statusStyle.bg} ${statusStyle.text}`}
      >
        {status === "completed" && <CheckCircle className="w-4 h-4" />}
        <span className="text-sm font-semibold">{statusStyle.label}</span>
      </div>
    </button>
  );
}
