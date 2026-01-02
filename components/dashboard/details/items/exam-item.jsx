import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { formatDate } from "@/utils/funcs";

export default function ExamItem({ item, role }) {
  const intl = useIntl();

  const {
    id,
    title,
    description,
    total_score,
    band_score,
    is_graded,
    is_published,
    created_at,
  } = item;

  const getStatusBadge = () => {
    if (!is_graded) {
      return {
        label: intl.formatMessage({ id: "Pending", defaultMessage: "Pending" }),
        class: "bg-yellow-50 text-yellow-700 border-yellow-100",
      };
    }
    if (!is_published) {
      return {
        label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }),
        class: "bg-gray-50 text-gray-700 border-gray-100",
      };
    }
    return {
      label: intl.formatMessage({
        id: "Published",
        defaultMessage: "Published",
      }),
      class: "bg-green-50 text-green-700 border-green-100",
    };
  };

  const status = getStatusBadge();

  return (
    <Link
      href={`/dashboard/exams/${id}`}
      className="group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
    >
      {/* Header: Title & Status */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {title ||
              intl.formatMessage({
                id: "Exam Task",
                defaultMessage: "Exam Task",
              })}
          </h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.class} ml-2 shrink-0`}
          >
            {status.label}
          </span>
        </div>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Body: Score & Date */}
      <div className="space-y-2.5 mb-4">
        {is_published && total_score !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <span className="font-semibold">
              {intl.formatMessage({ id: "Score", defaultMessage: "Score" })}:
            </span>
            <span className="font-bold text-primary">
              {total_score}
              {band_score && ` (${band_score})`}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} className="shrink-0" />
          <span>{formatDate(created_at)}</span>
        </div>
      </div>

      {/* Decoration Gradient on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
    </Link>
  );
}
