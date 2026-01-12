import React from "react";
import Link from "next/link";
import { useIntl } from "react-intl";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  MoreHorizontal,
  BookOpen,
  FileText,
  CheckCircle2,
  DoorOpen,
  DoorClosed,
  Eye,
  Edit,
  Trash,
  Rocket,
  Ban,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { Dropdown, DropdownBtn } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useRouter } from "next/router";
import {
  TASKS_RESULTS_EXAM_URL,
  TASKS_RESULTS_HOMEWORK_URL,
} from "@/mock/router";

export default function TaskItem({ item }) {
  const intl = useIntl();
  const { findParams } = useParams();
  const { openModal } = useModal();
  const { openOffcanvas } = useOffcanvas();
  const router = useRouter();

  // URL orqali turni aniqlash (exams yoki homeworks)
  const type = findParams("type");
  const isExam = type === "exams" || !!item.status;

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
    description,
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

  const handleOpenRoom = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Open room",
        description: "Are you sure you want to open this exam?",
        onConfirm: async () => {
          await authAxios.post(`/tasks/exams/${i}/open-room/`);
          toast.success(intl.formatMessage({ id: "Exam is opened!" }));
        },
      },
      "short"
    );
  };

  const handleCloseRoom = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Close room",
        description: "Are you sure you want to close this exam?",
        onConfirm: async () => {
          await authAxios.post(`/tasks/exams/${i}/close-room/`);
          toast.success(intl.formatMessage({ id: "Exam is closed!" }));
        },
      },
      "short"
    );
  };

  const handleView = (i) => {
    if (isExam) {
      router.push(
        `${TASKS_RESULTS_EXAM_URL}?type=exams&exam_id=${i}&is_graded=graded`
      );
    } else {
      router.push(
        `${TASKS_RESULTS_HOMEWORK_URL}?type=homeworks&homework_id=${i}`
      );
    }
  };

  const handleEdit = (i) => {
    openModal(
      "taskEditModal",
      {
        id: i,
        title: title,
        description: description,
        deadline: deadline,
      },
      "big"
    );
  };

  const handleDelete = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Delete task",
        description: "Are you sure you want to delete this task?",
        onConfirm: async () => {
          await authAxios.delete(`/tasks/${type}/${i}/`);
          toast.success(intl.formatMessage({ id: "Task is deleted!" }));
        },
      },
      "short"
    );
  };

  const handlePublishScores = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Publish score",
        description: "Are you sure you want to publish this exam results?",
        onConfirm: async () => {
          await authAxios.post(`/tasks/exams/${i}/publish-scores/`);
          toast.success(
            intl.formatMessage({ id: "Exam result is published!" })
          );
        },
      },
      "short"
    );
  };

  const handleUnPublishScores = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Unpublish score",
        description: "Are you sure you want to unpublish this exam results?",
        onConfirm: async () => {
          await authAxios.post(`/tasks/exams/${i}/unpublish-scores/`);
          toast.success(
            intl.formatMessage({ id: "Exam result is unpublished!" })
          );
        },
      },
      "short"
    );
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      {/* --- Header: Badges --- */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
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
          {!is_published && isExam && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              Unpublished
            </span>
          )}
        </div>

        {/* <button
          type="button"
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={18} />
        </button> */}

        <Dropdown
          width="w-44"
          buttonContent={<MoreHorizontal size={18} className="text-gray-400" />}
        >
          {/* for exams */}
          {isExam && (
            <>
              {status !== "OPEN" && (
                <DropdownBtn
                  title="Open room"
                  icon={<DoorOpen size={12} className="text-green-700" />}
                  className="text-green-700 text-sm"
                  onClick={() => handleOpenRoom(id)}
                />
              )}
              {status !== "CLOSED" && (
                <DropdownBtn
                  title="Close room"
                  icon={<DoorClosed size={12} className="text-red-700" />}
                  className="text-red-700 text-sm"
                  onClick={() => handleCloseRoom(id)}
                />
              )}
            </>
          )}

          {isExam && !is_published && (
            <DropdownBtn
              title="Publish score"
              icon={<Rocket size={12} className="text-textPrimary" />}
              className="text-textPrimary text-sm"
              onClick={() => handlePublishScores(id)}
            />
          )}
          {isExam && is_published && (
            <DropdownBtn
              title="Unpublish score"
              icon={<Ban size={12} className="text-textPrimary" />}
              className="text-textPrimary text-sm"
              onClick={() => handleUnPublishScores(id)}
            />
          )}

          {/* for all */}
          <DropdownBtn
            title="Veiw"
            icon={<Eye size={12} className="text-textPrimary" />}
            className="text-textPrimary text-sm"
            onClick={() => handleView(id)}
          />

          <DropdownBtn
            title="Edit"
            icon={<Edit size={12} className="text-textPrimary" />}
            className="text-textPrimary text-sm"
            onClick={() => handleEdit(id)}
          />

          <DropdownBtn
            title="Delete"
            icon={<Trash size={12} className="text-red-700" />}
            className="text-red-700 text-sm"
            onClick={() => handleDelete(id)}
          />
        </Dropdown>
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
            <span className="flex gap-1 flex-1">
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
