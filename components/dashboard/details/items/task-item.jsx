import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

export default function TaskItem({ item, role, user_id }) {
  const intl = useIntl();
  const { openModal } = useModal();

  // Destructure for cleaner access
  const {
    id,
    title,
    task_type,
    deadline,
    duration_minutes,
    active_students_count,
    is_exam_active,
    is_visible,
    created_at,
    created_by,
  } = item;

  // Helper to format Task Type (e.g., EXAM_MOCK -> Exam Mock)
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
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "CUSTOM_MOCK":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  // Check if deadline is passed
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  const handleDelete = (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(
      "confirmModal",
      {
        title: "Delete task",
        description:
          "Are you sure you want to delete this task? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/tasks/${taskId}/`);
          toast.success(
            intl.formatMessage({ id: "Task deleted successfully!" })
          );
          // Refresh will happen via modalClosed in tasks-lists
        },
      },
      "short"
    );
  };

  const handleEdit = (task, e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(
      "taskModal",
      {
        id: task.id,
        old_data: task,
      },
      "big"
    );
  };

  const canEdit = role === "CENTER_ADMIN" || (role !== "STUDENT" && created_by?.id === user_id);

  return (
    <div className="relative flex flex-col justify-between p-5 transition-all duration-300 bg-white border border-gray-200 group rounded-xl hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
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

          {/* Active Exam Indicator (Teacher View mostly) */}
          {is_exam_active && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Live
            </span>
          )}
        </div>

        {/* Actions */}
        {/* <div className="flex items-center gap-2">
          {!is_visible && (
            <div title="Hidden from students" className="text-gray-400">
              <AlertCircle size={16} />
            </div>
          )}
          {canEdit && (
            <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => handleEdit(item, e)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={(e) => handleDelete(id, e)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div> */}
      </div>

      {/* --- Body: Title & Meta --- */}
      <Link href={`/dashboard/tasks/${id}`} className="block mb-6">
        <h3 className="mb-3 text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-primary line-clamp-2">
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
      </Link>

      {/* --- Footer: Stats & Context --- */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
        {/* Student Count (Only if count exists or role is teacher) */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users size={16} className="text-gray-400" />
          <span className="font-medium">
            {active_students_count ? active_students_count : 0}
          </span>
          <span className="text-xs font-normal text-gray-400">
            {intl.formatMessage({ id: "students" })}
          </span>
        </div>

        {/* Created Date (Subtle) */}
        <span className="text-xs text-gray-400">{formatDate(created_at)}</span>
      </div>

      {/* Decoration Gradient on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 transition-opacity opacity-0 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:opacity-100 rounded-t-xl" />
    </div>
  );
}
