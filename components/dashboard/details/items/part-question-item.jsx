import { useModal } from "@/context/modal-context";
import { getQuestionTypeName } from "@/mock/data";
import { Edit, Plus, Trash } from "lucide-react";
import { useIntl } from "react-intl";

export default function PartQuestionItem({ group }) {
  const intl = useIntl();
  const { openModal } = useModal();

  return (
    <div className="group border border-gray-200 rounded-2xl p-5 hover:border-main/50 hover:shadow-md transition-all bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 pb-2">
            <span className="bg-blue-50 text-main text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {getQuestionTypeName(group?.question_type)}
            </span>
            <span className="text-gray-300">|</span>
            <h4 className="font-bold sm:text-base text-xs text-gray-800">
              {intl.formatMessage({ id: "Question group order" })}:{" "}
              {group.order}
            </h4>
          </div>
          <p className="text-xs text-gray-500">
            {group.instruction || "No instruction provided"}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() =>
              openModal(
                "questionGroupModal",
                { id: group?.id, initialData: group },
                "big"
              )
            }
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={14} />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-2">
        <div className="flex -space-x-2">
          {/* Savollar sonini ko'rsatuvchi kichik indikator */}
          <div className="text-[11px] font-medium text-gray-400">
            {group.questions?.length || 0} questions added
          </div>
        </div>

        <button className="flex items-center gap-1.5 text-xs font-bold text-main hover:bg-main hover:text-white border border-main px-3 py-1.5 rounded-lg transition-all">
          <Plus size={10} /> Add Question
        </button>
      </div>
    </div>
  );
}
