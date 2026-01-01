import React from "react";
import { useIntl } from "react-intl";

export default function HomeworkListItem({ item }) {
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
    const status = item.submission_status || item.status;

    switch (status) {
      case "DRAFT":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {intl.formatMessage({ id: "Draft", defaultMessage: "Draft" })}
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {intl.formatMessage({
              id: "Submitted",
              defaultMessage: "Submitted",
            })}
          </span>
        );
      case "GRADED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {intl.formatMessage({ id: "Graded", defaultMessage: "Graded" })}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            {intl.formatMessage({ id: "Pending", defaultMessage: "Pending" })}
          </span>
        );
    }
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-textPrimary line-clamp-2 flex-1">
          {item.title ||
            intl.formatMessage({ id: "Homework", defaultMessage: "Homework" })}
        </h3>
        {getStatusBadge()}
      </div>

      {item.description && (
        <p className="text-xs text-textSecondary line-clamp-2 mb-3">
          {item.description}
        </p>
      )}

      <div className="space-y-2 pt-3 border-t border-gray-100">
        {item.grade !== null && item.grade !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-textSecondary">
              {intl.formatMessage({ id: "Grade", defaultMessage: "Grade" })}:
            </span>
            <span className="text-sm font-bold text-main">{item.grade}</span>
          </div>
        )}

        {item.due_date && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-textSecondary">
              {intl.formatMessage({
                id: "Due Date",
                defaultMessage: "Due Date",
              })}
              :
            </span>
            <span
              className={`text-xs ${
                isOverdue ? "text-red-500 font-medium" : "text-textPrimary"
              }`}
            >
              {formatDate(item.due_date)}
              {isOverdue && " ⚠️"}
            </span>
          </div>
        )}

        {item.feedback && (
          <div className="pt-2">
            <p className="text-xs text-textSecondary mb-1">
              {intl.formatMessage({
                id: "Feedback",
                defaultMessage: "Feedback",
              })}
              :
            </p>
            <p className="text-xs text-textPrimary italic line-clamp-2">
              "{item.feedback}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
