import React from "react";
import {
  Edit,
  Trash2,
  Calendar,
  Layers,
  CheckCircle,
  BookOpen,
  MoveRight,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";

// Qiyinchilik darajasiga qarab ranglarni belgilash
const getDifficultyColor = (level) => {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return "text-green-600 bg-green-100";
    case "INTERMEDIATE":
      return "text-blue-600 bg-blue-100";
    case "ADVANCED":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export default function TemplateItem({ item, role, user_id }) {
  const { openModal } = useModal();
  const intl = useIntl();

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete template",
        description:
          "Are you sure you want to delete this template? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/material-templates/${id}/`);
          toast.success(
            intl.formatMessage({ id: "Template deleted successfully!" })
          );
        },
      },
      "short"
    );
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full relative">
      {/* 1. Header / Visual Section (Image o'rniga) */}
      <div className="h-32 w-full relative bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600">
          <Layers size={32} />
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-wider shadow-sm">
            {item.category?.replace("_", " ")}
          </span>
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
          {/* View / Start Button */}
          <button
            className="p-2 bg-white text-indigo-600 rounded-full hover:text-indigo-700 hover:scale-110 transition-all shadow-lg"
            title="View Details"
          >
            <BookOpen size={18} />
          </button>

          {role !== "STUDENT" &&
            (user_id === item?.created_by?.id || role === "CENTER_ADMIN") && (
              <>
                {/* Edit Button */}
                <button
                  onClick={() =>
                    openModal(
                      "templatesModal",
                      {
                        id: item?.id,
                        old_title: item?.title,
                        old_description: item?.description,
                        old_category: item?.category,
                        old_difficulty_level: item?.difficulty_level,
                        old_mocks: item?.mocks,
                      },
                      "big"
                    )
                  }
                  className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 hover:scale-110 transition-all shadow-lg"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item?.id)}
                  className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>

                {/* Assign to task Button */}
                {!item?.is_public && (
                  <button
                    onClick={() =>
                      openModal(
                        "assignTemplateToUser",
                        {
                          id: item?.id,
                        },
                        "short"
                      )
                    }
                    className="p-2 bg-white text-green-600 rounded-full hover:bg-green-50 hover:scale-110 transition-all shadow-lg"
                    title="Assign"
                  >
                    <MoveRight size={18} />
                  </button>
                )}
              </>
            )}
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3
          className="font-bold text-gray-800 text-lg leading-6 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors"
          title={item.title}
        >
          {item.title || "Untitled Template"}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {item.description || "No description provided."}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Mocks Count */}
          <div className="flex items-center bg-gray-50 p-2 rounded-lg">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded mr-2">
              <Layers size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                Items
              </span>
              <span className="text-xs font-bold text-gray-700">
                {item.mocks_count || 0}
              </span>
            </div>
          </div>

          {/* Times Practiced */}
          <div className="flex items-center bg-gray-50 p-2 rounded-lg">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded mr-2">
              <CheckCircle size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                Used
              </span>
              <span className="text-xs font-bold text-gray-700">
                {item.times_practiced || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Difficulty & Date */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(
              item.difficulty_level
            )} border-transparent`}
          >
            {item.difficulty_level || "GENERAL"}
          </span>

          <div className="flex items-center text-gray-400 text-xs">
            <Calendar size={14} className="mr-1.5" />
            <span>{formatDate(item?.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
