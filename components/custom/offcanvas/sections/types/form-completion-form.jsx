import { Input, Select } from "@/components/custom/details";
import React from "react";
import { Controller } from "react-hook-form";

export default function FormCompletionForm({ register, control, watch }) {
  const tokens = watch("tokens") || [];

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-dashed">
      <span className="text-xs font-bold text-gray-500 uppercase">
        Field Settings
      </span>

      {tokens.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No tokens (e.g., {"{{gap_1}}"}) found in text.
        </p>
      )}

      {tokens.map((token, index) => (
        <div
          key={token.id}
          className="bg-white p-4 rounded-lg border flex flex-col gap-3 shadow-sm"
        >
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold text-main">Token: {token.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              title="Correct Answers (comma separated)"
              register={register}
              name={`tokens.${index}.answers`}
              placeholder="e.g. 25, twenty-five"
              required
            />
            <Input
              title="Placeholder"
              register={register}
              name={`tokens.${index}.placeholder`}
              placeholder="e.g. Enter age"
            />
            <Input
              type="number"
              title="Max Words"
              register={register}
              name={`tokens.${index}.max_words`}
            />
            <Controller
              name={`tokens.${index}.type`}
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  title="Input UI Type"
                  options={[
                    { label: "Text Input", value: "text_input" },
                    { label: "Dropdown", value: "dropdown" },
                  ]}
                />
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
