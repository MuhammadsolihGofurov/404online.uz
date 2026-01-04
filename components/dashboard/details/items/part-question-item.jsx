import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useParams } from "@/hooks/useParams";
import { getQuestionTypeName } from "@/mock/data";
import { SECTIONS_QUESTIONS_URL } from "@/mock/router";
import { authAxios } from "@/utils/axios";
import { Edit, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function PartQuestionItem({ group }) {
  const intl = useIntl();
  const { openModal } = useModal();
  const { openOffcanvas } = useOffcanvas();
  const { findParams } = useParams();
  const sectionType = findParams("section") || "";
  const partId = findParams("partId") || "";
  const partNumber = findParams("partNumber") || "";
  const sectionId = findParams("sectionId") || "";

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Remove group",
        description:
          "Are you sure you want to delete this group? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/editor/${sectionType}-groups/${id}/`);
          toast.success(intl.formatMessage({ id: "Group deleted!" }));
        },
      },
      "short"
    );
  };

  return (
    <div className="group border border-gray-200 rounded-2xl p-5 hover:border-main/50 hover:shadow-md transition-all bg-white">
      <div className="flex justify-between items-start pb-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start gap-2 pb-2">
            <span className="bg-blue-50 text-main text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {getQuestionTypeName(group?.question_type || group?.group_type)}
            </span>
            <h4 className="font-bold sm:text-base text-xs text-gray-800">
              {intl.formatMessage({ id: "Question group order" })}:{" "}
              {group.order}
            </h4>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            {group.instruction || "No instruction provided"}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() =>
              openOffcanvas(
                "questionGeneratorOffcanvas",
                { id: group?.id, initialData: group },
                "right"
              )
            }
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDelete(group?.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-2">
        <div className="flex -space-x-2">
          {/* Savollar sonini ko'rsatuvchi kichik indikator */}
          <div className="text-[11px] font-medium text-gray-400">
            {group.question_count || 0} questions added
          </div>
        </div>

        {/* <Link
          href={`${SECTIONS_QUESTIONS_URL}?section=${sectionType}&sectionId=${sectionId}&partId=${partId}&partNumber=${partNumber}&groupId=${
            group?.id
          }&questionType=${group?.question_type || group?.group_type}`}
          className="flex items-center gap-1.5 text-xs font-bold text-main hover:bg-main hover:text-white border border-main px-3 py-1.5 rounded-lg transition-all"
        >
          <Plus size={10} /> Add Question
        </Link> */}
      </div>
    </div>
  );
}
