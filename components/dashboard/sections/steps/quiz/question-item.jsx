import { useFieldArray } from "react-hook-form";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Input } from "@/components/custom/details";

export default function QuestionItem({
  qIndex,
  register,
  control,
  errors,
  watch,
  unregister,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `content.${qIndex}.options`,
  });

  const correctValue = watch(`content.${qIndex}.correct`);

  return (
    <div className="p-6 border rounded-2xl bg-white shadow-sm mb-6 relative group">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-700">Question {qIndex + 1}</h4>
        <button
          type="button"
          onClick={() => unregister(`content.${qIndex}`)}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      <Input
        register={register}
        name={`content.${qIndex}.q`}
        placeholder="Enter your question here..."
        className="mb-4"
        validation={{ required: "Question text is required" }}
        error={errors?.content?.[qIndex]?.q?.message}
      />

      <div className="space-y-3 mt-4">
        <p className="text-sm font-medium text-slate-500">
          Options (Select the correct one):
        </p>
        {fields.map((field, oIndex) => (
          <div key={field.id} className="flex items-center gap-3 group/option">
            <input
              type="radio"
              value={oIndex}
              {...register(`content.${qIndex}.correct`, {
                valueAsNumber: true,
              })}
              checked={Number(correctValue) === oIndex}
              className="w-4 h-4 text-main border-gray-300 focus:ring-main"
            />
            <div className="flex-1">
              <input
                {...register(`content.${qIndex}.options.${oIndex}`)}
                placeholder={`Option ${oIndex + 1}`}
                className="w-full border-b border-gray-200 py-1 focus:border-main outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(oIndex)}
              className="opacity-0 group-hover/option:opacity-100 text-slate-400 hover:text-red-500 transition-all"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append("")}
          className="flex items-center gap-2 text-sm text-main font-medium mt-2 hover:underline"
        >
          <PlusIcon size={16} /> Add Option
        </button>
      </div>
    </div>
  );
}
