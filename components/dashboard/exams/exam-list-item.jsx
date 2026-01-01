import React from "react";
import { useIntl } from "react-intl";

export default function ExamListItem({ item }) {
  const intl = useIntl();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = () => {
    if (!item.is_graded) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          {intl.formatMessage({ id: "Pending", defaultMessage: "Pending" })}
        </span>
      );
    }
    if (!item.is_published) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          {intl.formatMessage({ id: "Graded", defaultMessage: "Graded" })}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        {intl.formatMessage({ id: "Published", defaultMessage: "Published" })}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-textPrimary line-clamp-2 flex-1">
          {item.title ||
            intl.formatMessage({
              id: "Exam Task",
              defaultMessage: "Exam Task",
            })}
        </h3>
        {getStatusBadge()}
      </div>

      {item.description && (
        <p className="text-xs text-textSecondary line-clamp-2 mb-3">
          {item.description}
        </p>
      )}

      <div className="space-y-2 pt-3 border-t border-gray-100">
        {item.is_published && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-textSecondary">
              {intl.formatMessage({ id: "Score", defaultMessage: "Score" })}:
            </span>
            <span className="text-sm font-bold text-main">
              {item.total_score || 0}
              {item.band_score && ` (${item.band_score})`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-textSecondary">
            {intl.formatMessage({ id: "Date", defaultMessage: "Date" })}:
          </span>
          <span className="text-xs text-textPrimary">
            {formatDate(item.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
