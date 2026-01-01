import React from "react";
import { useFieldArray } from "react-hook-form";
import { Input } from "@/components/custom/details";
import { ListOrdered } from "lucide-react";
import { getDisplayQuestionNumber } from "@/utils/question-helpers";

export default function MatchingHeadingForm({
  register,
  control,
  availableOptions,
  setValue,
  watch,
  questionType,
}) {
  const { fields } = useFieldArray({ control, name: "tokens" });
  const watchText = watch("text") || "";

  const getTitle = () => {
    switch (questionType) {
      case "MATCH_INFO":
        return "Information Matching";
      case "MATCH_FEATURES":
        return "Features Matching";
      default:
        return "Heading Matching";
    }
  };

  const handleDragStart = (e, optionText) => {
    const label = optionText.split(".")[0].trim();
    e.dataTransfer.setData("text/plain", label);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const label = e.dataTransfer.getData("text/plain");
    setValue(`tokens.${index}.answers`, label, {
      shouldValidate: true,
      shouldDirty: true,
    });
    e.currentTarget.classList.remove("bg-blue-100", "border-blue-500");
  };

  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-2 font-bold text-lg uppercase text-gray-700">
        <ListOrdered className="text-main" size={20} />
        {getTitle()}
      </div>

      {/* OPTIONS BANK */}
      <div className="bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-[11px] font-bold text-gray-500 uppercase mb-3">
          Drag labels to the questions below:
        </p>
        <div className="flex flex-wrap gap-2">
          {availableOptions?.map((opt, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => handleDragStart(e, opt)}
              className="cursor-grab active:cursor-grabbing bg-white border px-3 py-2 rounded-lg shadow-sm hover:border-main font-medium text-sm transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      {/* DROPPABLE TARGETS */}
      <div className="grid grid-cols-1 gap-4">
        {fields.map((field, index) => {
          // Xatolikni oldini olish uchun butun field obyektini uzatamiz
          const qNumber = getDisplayQuestionNumber(questionType, field, index, watchText);

          return (
            <div
              key={field.id}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-blue-100", "border-blue-500");
              }}
              onDragLeave={(e) =>
                e.currentTarget.classList.remove(
                  "bg-blue-100",
                  "border-blue-500"
                )
              }
              className="p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white flex items-center justify-between transition-all"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Question Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl text-main">
                    №{qNumber}
                  </span>
                </div>
              </div>

              <div className="w-1/2 relative">
                <Input
                  name={`tokens.${index}.answers`}
                  placeholder="Drop label here"
                  register={register}
                  className="bg-gray-50 text-center font-bold text-lg text-main border-2 border-gray-200 pointer-events-none"
                  readOnly
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
