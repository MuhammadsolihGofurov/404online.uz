import React from "react";
import { Edit2, Trash2, Hash, CheckCircle } from "lucide-react";
import { renderTextWithTokens } from "@/utils/funcs";
import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";
import { useOffcanvas } from "@/context/offcanvas-context";

const QuestionItem = ({ question }) => {
  const { openModal } = useModal();
  const { findParams } = useParams();
  const { openOffcanvas } = useOffcanvas();
  const intl = useIntl();
  const sectionType = findParams("section") || "";
  // Matndagi {{gap_1}} kabi tokenlarni ajratib ko'rsatish uchun render funksiyasi

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Remove question",
        description:
          "Are you sure you want to delete this question? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/editor/${sectionType}-questions/${id}/`);
          toast.success(intl.formatMessage({ id: "Question deleted!" }));
        },
      },
      "short"
    );
  };

  const handleEdit = () => {
    openOffcanvas(
      "questionOffcanvas",
      { id: question?.id, initialData: question },
      "right"
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-main/10 text-main w-8 h-8 rounded-lg flex items-center justify-center font-bold">
            {question.question_number}
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {sectionType} Question
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit()}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(question?.id)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="text-gray-800 text-sm leading-relaxed mb-4">
        {renderTextWithTokens(question.text)}
      </div>

      {/* Answers Section */}
      <div className="space-y-3 border-t pt-4">
        {Object.entries(question.correct_answer || {}).map(([key, answers]) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
              <Hash size={12} /> {key.toUpperCase()} SETTINGS:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs border border-green-100">
                <CheckCircle size={12} />
                {Array.isArray(answers) ? answers.join(" / ") : answers}
              </div>
              {question.metadata?.[key] && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Type: {question.metadata[key].type}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionItem;
