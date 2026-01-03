import React from "react";
import { useFieldArray } from "react-hook-form";
import { Input } from "@/components/custom/details";
import { Link2 } from "lucide-react";
import { getDisplayQuestionNumber } from "@/utils/question-helpers";

export default function MatchingQuestionForm({ register, control , questionType}) {
  const { fields } = useFieldArray({ control, name: "tokens" });

  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-2 font-bold text-lg uppercase text-gray-700">
        <Link2 className="text-main" size={20} />
        Matching Settings
      </div>

      <div className="grid grid-cols-1 gap-4">
        {fields.map((field, index) => {
          const qNumber = getDisplayQuestionNumber(questionType, field, index);
          return (
            <div
              key={field.id}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b pb-1">
                <span className="font-bold text-main uppercase text-sm">
                  Question №{qNumber}
                </span>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    {...register(`tokens.${index}.allow_reuse`)}
                    className="rounded border-gray-300"
                  />
                  Allow reuse (variantni qayta ishlatish)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name={`tokens.${index}.answers`}
                  title="Correct Letter (e.g. A)"
                  register={register}
                  required
                />
                <Input
                  name={`tokens.${index}.options`}
                  title="Options (A, B, C, D, E)"
                  register={register}
                  defaultValue="A, B, C, D, E"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
