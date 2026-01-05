import React from "react";
import { useIntl } from "react-intl";
import { BookOpen, ClipboardList, Zap } from "lucide-react";

/**
 * EmptyState Component
 * Shows a friendly message with icon when no items are available
 */
export default function EmptyState({ type = "default", title, description }) {
  const intl = useIntl();

  const configs = {
    exams: {
      icon: BookOpen,
      defaultTitle: intl.formatMessage({
        id: "No exams yet",
        defaultMessage: "No exams yet",
      }),
      defaultDescription: intl.formatMessage({
        id: "When new exams are available, they will appear here. Check back soon!",
        defaultMessage:
          "When new exams are available, they will appear here. Check back soon!",
      }),
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    homeworks: {
      icon: ClipboardList,
      defaultTitle: intl.formatMessage({
        id: "No homeworks yet",
        defaultMessage: "No homeworks yet",
      }),
      defaultDescription: intl.formatMessage({
        id: "When new homeworks are assigned, they will show up here.",
        defaultMessage:
          "When new homeworks are assigned, they will show up here.",
      }),
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    default: {
      icon: Zap,
      defaultTitle: intl.formatMessage({
        id: "Nothing to do",
        defaultMessage: "Nothing to do",
      }),
      defaultDescription: intl.formatMessage({
        id: "It looks like there's nothing here right now. Check back later!",
        defaultMessage:
          "It looks like there's nothing here right now. Check back later!",
      }),
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
  };

  const config = configs[type] || configs.default;
  const Icon = config.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 ${config.bgColor} rounded-2xl border-2 ${config.borderColor}`}
    >
      <div className={`${config.color} mb-6 opacity-80`}>
        <Icon className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.5} />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
        {title || config.defaultTitle}
      </h3>

      <p className="text-gray-600 text-center max-w-md text-sm sm:text-base leading-relaxed">
        {description || config.defaultDescription}
      </p>

      <div className="mt-8 flex gap-2 flex-col sm:flex-row">
        <a
          href="/dashboard"
          className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition border border-gray-200 text-sm sm:text-base"
        >
          {intl.formatMessage({
            id: "Back to Dashboard",
            defaultMessage: "Back to Dashboard",
          })}
        </a>
      </div>
    </div>
  );
}
