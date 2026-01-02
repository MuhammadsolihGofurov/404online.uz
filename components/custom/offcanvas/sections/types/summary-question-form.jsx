import React from "react";
import { useFieldArray } from "react-hook-form";
import { getDisplayQuestionNumber } from "@/utils/question-helpers";
import { Input } from "@/components/custom/details";

const SummaryQuestionForm = ({ register, watch }) => {
  const tokens = watch("tokens") || [];

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-gray-50 mt-4">
      <h3 className="font-bold text-lg text-gray-700 border-b pb-2 flex items-center gap-2">
        <span className="bg-main text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
          ?
        </span>
        Detected Questions & Answers
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {tokens.map((token, index) => (
          <div
            key={token.id}
            className="p-4 bg-white border rounded-lg shadow-sm flex flex-col gap-3"
          >
            <div className="flex flex-col">
              {/* Userga qaysi gap tahlil qilinayotganini ko'rsatamiz */}
              <span className="text-xs font-bold text-main uppercase">
                Question {token.q_num}
              </span>
              <p className="text-sm text-gray-600 italic mt-1 line-clamp-1 border-l-2 border-main/20 pl-2">
                "{token.full_line}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                title="Correct Answer(s)"
                placeholder="Separate with comma (e.g. water, liquid)"
                name={`tokens.${index}.answers`}
                register={register}
                required
              />
              <Input
                type="number"
                title="Max Words"
                name={`tokens.${index}.max_words`}
                register={register}
              />
            </div>
          </div>
        ))}

        {tokens.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed rounded-xl text-gray-400">
            Paste text starting with numbers (e.g., "14. The weather...") above
            to auto-generate inputs.
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryQuestionForm;
