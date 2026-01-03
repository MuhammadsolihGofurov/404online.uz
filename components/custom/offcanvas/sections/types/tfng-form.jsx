import React from "react";
import { Input, Select } from "@/components/custom/details";
import { getDisplayQuestionNumber } from "@/utils/question-helpers";
import { CheckCircle2 } from "lucide-react";
import { Controller } from "react-hook-form";

export default function TFNGForm({ register, control, watch, questionType }) {
  const watchText = watch("text") || "";
  const tokens = watch("tokens") || [];

  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-2 font-bold text-lg uppercase text-gray-700">
        <CheckCircle2 className="text-main" size={20} />
        {questionType === "YNNG"
          ? "Yes / No / Not Given"
          : "True / False / Not Given"}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tokens.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            Please add tokens like {"{{tfng_1}}"} in the text area.
          </p>
        )}

        {tokens.map((token, index) => {
          const qNumber = getDisplayQuestionNumber(
            questionType,
            token,
            index,
            watchText
          );

          return (
            <div
              key={token.id}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-4 shadow-sm transition-all hover:border-main"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-black text-main text-lg italic">
                  Question №{qNumber}
                </span>
                <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-500 font-mono">
                  {token.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* To'g'ri javobni tanlash */}
                <Controller
                  name={`tokens.${index}.answers`}
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      title="Correct Answer"
                      options={[
                        {
                          label: "TRUE / YES",
                          value: questionType === "YNNG" ? "YES" : "TRUE",
                        },
                        {
                          label: "FALSE / NO",
                          value: questionType === "YNNG" ? "NO" : "FALSE",
                        },
                        { label: "NOT GIVEN", value: "NOT GIVEN" },
                      ]}
                    />
                  )}
                />

                {/* UI Turi (Input yoki Dropdown) */}
                <Controller
                  name={`tokens.${index}.type`}
                  control={control}
                  defaultValue="dropdown"
                  render={({ field }) => (
                    <Select
                      {...field}
                      title="Display As"
                      options={[
                        { label: "Dropdown Menu", value: "dropdown" },
                        { label: "Text Input", value: "text_input" },
                      ]}
                    />
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
