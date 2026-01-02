import React from "react";
import { useFieldArray } from "react-hook-form";
import { getDisplayQuestionNumber } from "@/utils/question-helpers";
import { Input } from "@/components/custom/details";

const SummaryQuestionForm = ({ register, control, watch }) => {
  const { fields } = useFieldArray({
    control,
    name: "tokens",
  });

  const watchText = watch("text");

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-gray-50 mt-4">
      <h3 className="font-bold text-lg text-gray-700 border-b pb-2">
        Question Answers
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => {
          // Savol raqamini hisoblash
          const displayNum = getDisplayQuestionNumber(
            "SUMMARY",
            field,
            index,
            watchText
          );

          // Agar matndan raqam topilmagan bo'lsa (ya'ni index+1 qaytgan bo'lsa),
          // Inputdagi question_number dan hisoblaymiz
          const startNo = parseInt(watch("question_number") || 1);
          const finalNum =
            displayNum == index + 1 ? startNo + index : displayNum;

          return (
            <div
              key={field.id}
              className="p-4 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-8 h-8 bg-main text-white rounded-full font-bold">
                  {finalNum}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  Question Number
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <Input
                  title="Correct Answer(s)"
                  placeholder="e.g. water, liquid"
                  name={`tokens.${index}.answers`}
                  register={register}
                  required
                />

                {/* <div className="w-1/2"> */}
                <Input
                  type="number"
                  title="Max Words"
                  name={`tokens.${index}.max_words`}
                  register={register}
                />
                {/* </div> */}
              </div>
            </div>
          );
        })}
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-orange-500 italic">
          No questions detected. Please start lines with a number (e.g., 1.
          James Watt...)
        </p>
      )}
    </div>
  );
};

export default SummaryQuestionForm;
