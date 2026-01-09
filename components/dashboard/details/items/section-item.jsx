import React from "react";
import {
  Clock,
  BookOpen,
  Calendar,
  ChevronRight,
  Eye,
  RotateCcw,
  Edit,
  Trash,
} from "lucide-react";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";
import Link from "next/link";
import { CREATE_QUIZ_URL } from "@/mock/router";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

const SectionItem = ({ data }) => {
  const { findParams } = useParams();
  const { openModal } = useModal();

  const currentSectionType = findParams("section") || null;
  const isQuiz = currentSectionType === "quiz";

  const statusStyles = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    EXAM: "bg-red-50 text-red-600 border-red-100",
    PRACTICE: "bg-blue-50 text-blue-600 border-blue-100",
    HOMEWORK: "bg-purple-50 text-purple-600 border-purple-100",
    PUBLISHED: "bg-emerald-50 text-emerald-600 border-emerald-100", // Quizlarda odatda PUBLISHED bo'ladi
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Davomiylikni aniqlash uchun universal funksiya
  const getDuration = () => {
    if (isQuiz) {
      return data?.default_duration_minutes
        ? `${data.default_duration_minutes} min`
        : "10 min";
    }
    // Agar mock section bo'lsa (duration: "00:40:00")
    return data?.duration ? data.duration.substring(0, 5) : "00:00";
  };

  // Savollar yoki topshiriqlar sonini aniqlash
  const getCountInfo = () => {
    if (isQuiz) {
      return `Q: ${data?.content?.length || 0}`;
    }
    if (currentSectionType === "writing") {
      return `T: ${data?.tasks_count || 0}`;
    }
    return `Q: ${data?.questions_count || 0}`;
  };

  const handleViewFunction = (d) => {
    // Quiz uchun alohida modal yoki logika kerak bo'lsa shu yerda tekshiring
    openModal("sectionView", { data: d, isQuiz }, "small");
  };

  const handleChangeStatus = (d) => {
    openModal(
      "sectionStatusChangeModal",
      { id: d?.id, sectionType: currentSectionType, status: d?.status },
      "small"
    );
  };

  const handleDelete = (i) => {
    openModal(
      "confirmModal",
      {
        title: "Remove quiz",
        description:
          "Are you sure you want to delete this quiz? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/quizzes/${i}/`);
          toast.success(intl.formatMessage({ id: "Quiz deleted!" }));
        },
      },
      "short"
    );
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      <div className="flex justify-between items-center mb-5">
        <div
          className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase border ${
            statusStyles[data?.status] || statusStyles?.DRAFT
          }`}
        >
          {currentSectionType == "quiz" ? "QUIZ" : data?.status || "DRAFT"}
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <ChevronRight size={18} />
        </div>
      </div>

      <h3 className="text-gray-800 font-bold text-lg mb-4 line-clamp-2 leading-tight h-12">
        {data?.title}
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center text-gray-500 bg-gray-50 rounded-xl p-2">
          <Clock size={15} className="mr-2 text-blue-500" />
          <span className="text-xs font-medium">{getDuration()}</span>
        </div>
        <div className="flex items-center text-gray-500 bg-gray-50 rounded-xl p-2">
          <BookOpen size={15} className="mr-2 text-emerald-500" />
          <span className="text-xs font-medium">{getCountInfo()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center text-[11px] text-gray-400">
          <Calendar size={13} className="mr-1" />
          {formatDate(data?.created_at)}
        </div>
        <div className="flex items-center gap-2">
          {currentSectionType !== "quiz" ? (
            <>
              <button
                onClick={() => handleViewFunction(data)}
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleChangeStatus(data)}
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-400 hover:text-orange-500"
              >
                <RotateCcw size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href={
                  CREATE_QUIZ_URL + `?id=${data?.id}&section=quiz&type=edit`
                }
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => handleDelete(data?.id)}
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-400 hover:text-orange-500"
              >
                <Trash size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionItem;
