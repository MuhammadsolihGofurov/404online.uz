import React from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Music,
  File,
  Download,
  Calendar,
  Edit,
  Trash2,
  Eye,
  User,
  UserPlus, // User ikonkasini import qildim
} from "lucide-react";
import { formatDate, handleDownload } from "@/utils/funcs";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";

const getFileVisuals = (type) => {
  switch (type) {
    case "PDF":
      return {
        icon: <FileText size={32} />,
        color: "text-red-500",
        bg: "bg-red-50",
      };
    case "DOC":
    case "DOCX":
      return {
        icon: <FileText size={32} />,
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    case "XLS":
    case "XLSX":
      return {
        icon: <FileSpreadsheet size={32} />,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "IMAGE":
      return {
        icon: <ImageIcon size={32} />,
        color: "text-purple-600",
        bg: "bg-purple-50",
      };
    case "AUDIO":
      return {
        icon: <Music size={32} />,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    default:
      return {
        icon: <File size={32} />,
        color: "text-gray-500",
        bg: "bg-gray-50",
      };
  }
};

export default function DocumentItem({ item, role }) {
  const visuals = getFileVisuals(item.file_type);
  const { openModal } = useModal();
  const intl = useIntl();

  const isImage = item.file_type === "IMAGE" && item.file;

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete document",
        description:
          "Are you sure you want to delete this document? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/materials/${id}/`);
          toast.success(
            intl.formatMessage({ id: "Material deleted successfully!" })
          );
        },
      },
      "short"
    );
  };

  const handleDownloadFn = (file, name) => {
    const isDownload = handleDownload(file, name);
    if (isDownload === "success") {
      toast.success(
        intl.formatMessage({ id: "Download is successfully done!" })
      );
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full relative">
      {/* Preview Section */}
      <div
        className={`h-40 w-full relative overflow-hidden ${
          !isImage ? visuals.bg : "bg-gray-100"
        }`}
      >
        {isImage ? (
          <img
            src={item.file}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${visuals.color}`}
          >
            {visuals.icon}
          </div>
        )}

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
          {/* View Button */}
          <a
            href={item.file}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-white text-gray-700 rounded-full hover:text-main hover:scale-110 transition-all shadow-lg"
            title="Ko'rish"
          >
            <Eye size={18} />
          </a>

          {/* Download Button (Yangi qo'shildi) */}
          <button
            onClick={() => handleDownloadFn(item?.file, item?.name)}
            rel="noreferrer"
            className="p-2 bg-white text-green-600 rounded-full hover:bg-green-50 hover:scale-110 transition-all shadow-lg"
            title="Yuklab olish"
          >
            <Download size={18} />
          </button>

          {role !== "STUDENT" && (
            <>
              {/* Edit Button */}
              <button
                onClick={() =>
                  openModal(
                    "documentsModal",
                    { id: item?.id, initialData: item },
                    "short"
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

              {/* Assign Button */}
              {!item?.is_public && (
                <button
                  onClick={() =>
                    openModal(
                      "assignDocumentToUser",
                      {
                        old_students: item?.assigned_students,
                        old_groups: item?.assigned_students,
                        id: item?.id,
                      },
                      "short"
                    )
                  }
                  className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-50 hover:scale-110 transition-all shadow-lg"
                  title="Assign"
                >
                  <UserPlus size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${visuals.bg} ${visuals.color}`}
            >
              {item.file_type}
            </span>
            {item.file_size && (
              <span className="text-xs text-gray-400">{item.file_size}</span> // Size dinamik bo'lishi mumkin
            )}
          </div>

          <h3
            className="font-bold text-gray-800 text-lg line-clamp-2 mb-2"
            title={item.name}
          >
            {item.name || "Untitled Document"}
          </h3>

          {item.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer: Date & Created By */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
          {/* Date */}
          <div className="flex items-center text-gray-400 text-xs">
            <Calendar size={14} className="mr-1.5" />
            <span>{formatDate(item?.created_at)}</span>
          </div>

          {/* Created By (Yangi qo'shildi) */}
          {item.created_by && (
            <div
              className="flex items-center text-gray-500 text-xs font-medium"
              title={item.created_by.full_name}
            >
              <span className="mr-1.5 text-right truncate max-w-[100px]">
                {item.created_by.full_name}
              </span>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <User size={14} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
