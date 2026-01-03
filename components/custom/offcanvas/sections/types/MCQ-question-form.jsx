import React from "react";
import { useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input, Select } from "@/components/custom/details";
import MultiSelect from "@/components/custom/details/multi-select";

export default function McqQuestionForm({ register, control, watch }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mcq_options",
  });

  const getLetter = (index) => String.fromCharCode(65 + index);

  // Variantlarni MultiSelect formatiga o'tkazish
  const selectOptions = fields.map((_, i) => ({
    id: getLetter(i),
    title: `Option ${getLetter(i)}`,
  }));

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-sm font-bold text-gray-700 uppercase">
          MCQ Configuration
        </span>
        <button
          type="button"
          onClick={() => append({ text: "" })}
          className="text-xs bg-main text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Plus size={14} /> Add Option
        </button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <span className="font-bold text-main w-4">{getLetter(index)}</span>
            <div className="flex-1">
              <Input
                placeholder={`Option ${getLetter(index)} content`}
                register={register}
                name={`mcq_options.${index}.text`}
                required
              />
            </div>
            {fields.length > 2 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t">
        {/* MultiSelect orqali to'g'ri javoblarni tanlash */}
        <Controller
          name="correct_answer_mcq"
          control={control}
          render={({ field }) => (
            <MultiSelect
              {...field}
              title="Mark Correct Answer(s)"
              placeholder="Select letters..."
              options={selectOptions}
            />
          )}
        />

        <Controller
          name="mcq_display_type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              title="UI Display Type"
              options={[
                { label: "Radio Buttons", value: "radio" },
                { label: "Dropdown Menu", value: "dropdown" },
              ]}
            />
          )}
        />
      </div>
    </div>
  );
}
