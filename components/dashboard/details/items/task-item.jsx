import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  MoreHorizontal,
  BookOpen,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";

export default function TaskItem({ item }) {
  const intl = useIntl();
  const params = useParams();

  // URL orqali turni aniqlash (exams yoki homeworks)
  const isExam = params.type === "exams" || !!item.status;

  const {
    id,
    title,
    status,
    is_published,
    assigned_groups,
    assigned_groups_count,
    items_count,
    deadline,
    created_at,
    created_by_name,
  } = item;

  // Status ranglarini aniqlash
  const getStatusStyles = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-green-50 text-green-700 border-green-100";
      case "CLOSED":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
      {/* --- Header: Badges --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {/* Tur belgisi (Exam yoki Homework) */}
          <span
            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isExam
                ? "bg-purple-50 text-purple-700 border-purple-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            }`}
          >
            {isExam ? <FileText size={12} /> : <BookOpen size={12} />}
            {isExam ? "Exam" : "Homework"}
          </span>

          {/* Status (Faqat Exam uchun) */}
          {status && (
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusStyles(
                status
              )}`}
            >
              {status}
            </span>
          )}

          {/* Draft/Published holati */}
          {!is_published && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              Draft
            </span>
          )}
        </div>

        <button type="button" className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* --- Body: Title & Info --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        <div className="space-y-2">
          {/* Deadline (Homeworkda bo'ladi) */}
          {deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={15} className="text-gray-400" />
              <span>
                {intl.formatMessage({ id: "deadline" })}:{" "}
                {intl.formatDate(deadline, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* Assigned Groups */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={15} className="text-gray-400" />
            <span className="flex gap-1">
              {assigned_groups?.length > 0
                ? assigned_groups.map((g) => g.name).join(", ")
                : `${assigned_groups_count || 0} groups`}
            </span>
          </div>

          {/* Homework Items count */}
          {items_count !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 size={15} className="text-gray-400" />
              <span>
                {items_count} {intl.formatMessage({ id: "tasks" })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- Footer --- */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 uppercase tracking-tighter">
            Created by
          </span>
          <span className="text-xs font-medium text-gray-600">
            {created_by_name}
          </span>
        </div>

        <span className="text-[11px] text-gray-400 self-end">
          {formatDate(created_at)}
        </span>
      </div>

      {/* Hover Line Effect */}
      <div
        className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl ${
          isExam ? "bg-purple-500" : "bg-blue-500"
        }`}
      />
    </div>
  );
}
