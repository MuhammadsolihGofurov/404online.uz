import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import {
  Check,
  FileText,
  Trash2,
  Upload,
  PlusCircle,
  Save,
  X,
  Plus,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";

export default function MCQAutoGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      questions: [],
    },
  });

  const { fields, remove, replace, append } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedQuestions = watch("questions");

  const handleProcessImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const toastId = toast.loading("AI is scanning your screenshots...");

    try {
      // 1. Gemini orqali rasmlarni tahlil qilish
      const data = await scanIELTSWithGemini(files);

      // 2. AI dan kelgan ma'lumotni yangi dinamik strukturamizga o'tkazamiz
      const formatted = data.map((q, idx) => {
        // AI javobi bitta string bo'lsa (masalan "A"), uni massivga aylantiramiz ["A"]
        const correctAnswers = Array.isArray(q.answer)
          ? q.answer
          : [q.answer || "A"];

        return {
          question_number: q.question_number || idx + 1,
          text: q.text || "",
          correct_answers: correctAnswers, // Multi-select uchun massiv
          options: (q.options || ["", "", "", ""]).map((opt) => ({
            text: typeof opt === "string" ? opt : opt.text, // AI string qaytarsa ham obyekt qilamiz
          })),
        };
      });

      // 3. Local formani AI dan kelgan ma'lumot bilan to'ldirish
      replace(formatted);

      toast.update(toastId, {
        render: `Successfully scanned ${data.length} questions!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error("AI Scan Error:", err);
      toast.update(toastId, {
        render: "Analysis failed. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  // --- INITIAL DATA HANDLING ---
  useEffect(() => {
    if (id && initialData) {
      const metadata = initialData.metadata?.gap_1 || {};
      const formattedQuestion = {
        question_number: initialData.question_number,
        text: initialData.text.replace("{{gap_1}}", "").trim(),
        // Multi-select bo'lishi mumkin bo'lgan javoblar massivi
        correct_answers: initialData.correct_answer?.gap_1 || ["A"],
        options: (metadata.options || []).map((opt) => ({ text: opt.text })),
      };

      replace([formattedQuestion]);
    }
  }, [id, initialData, replace]);

  // --- HELPER TO FORMAT PAYLOAD ---
  const formatPayload = (q) => {
    // Agar bir nechta javob bo'lsa, display har doim checkbox/dropdown bo'ladi
    const isMultiple = q.correct_answers.length > 1;

    return {
      question_number: parseInt(q.question_number),
      text: q.text.includes("{{gap_1}}") ? q.text : `${q.text} {{gap_1}}`,
      group: groupId,
      correct_answer: { gap_1: q.correct_answers }, // Massiv ko'rinishida yuboramiz
      metadata: {
        gap_1: {
          type: "mcq",
          display: isMultiple ? "checkbox" : "radio",
          is_multiple: isMultiple,
          options: q.options.map((opt, i) => ({
            letter: String.fromCharCode(65 + i),
            text: opt.text,
          })),
        },
      },
    };
  };

  // --- MANUAL ADD ---
  const addNewQuestion = () => {
    const lastNumber =
      watchedQuestions.length > 0
        ? Math.max(
            ...watchedQuestions.map((q) => parseInt(q.question_number) || 0)
          )
        : 0;

    append({
      question_number: lastNumber + 1,
      text: "",
      correct_answers: ["A"], // Massiv sifatida saqlaymiz
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    });
  };

  const onSubmit = async (values) => {
    if (values.questions.length === 0) return toast.error("No data to save");
    setIsSubmitting(true);
    const toastId = toast.loading(id ? "Updating..." : "Saving...");

    try {
      if (id) {
        const payload = formatPayload(values.questions[0]);
        await authAxios.patch(
          `/editor/${sectionType}-questions/${id}/`,
          payload
        );
      } else {
        const requests = values.questions.map((q) =>
          authAxios.post(`/editor/${sectionType}-questions/`, formatPayload(q))
        );
        await Promise.all(requests);
      }
      toast.update(toastId, {
        render: "Success!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (error) {
      toast.update(toastId, {
        render: "Error occurred",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50/50 rounded-3xl">
      {/* --- ACTION BAR --- */}
      {!id && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <label className="md:col-span-2 group relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-3xl bg-white hover:bg-gray-50 hover:border-indigo-400 transition-all cursor-pointer">
            {loading ? (
              <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload size={24} className="text-indigo-500 mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  AI Scanner
                </p>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleProcessImages}
              className="hidden"
              disabled={loading}
            />
          </label>
          <button
            type="button"
            onClick={addNewQuestion}
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-3xl bg-white hover:bg-emerald-50 transition-all"
          >
            <PlusCircle size={24} className="text-emerald-500 mb-2" />
            <p className="text-sm font-semibold">Add New</p>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <QuestionItem
            key={field.id}
            index={index}
            register={register}
            control={control}
            remove={() => remove(index)}
            showRemove={!id}
            watch={watch}
          />
        ))}

        {fields.length > 0 && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            {isSubmitting ? "Saving..." : <Save size={20} />} Save Changes
          </button>
        )}
      </form>
    </div>
  );
}

// --- ICHKI KOMPONENT: SAVOL ITEMI ---
function QuestionItem({ index, register, control, remove, showRemove, watch }) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  const correctAnswers = watch(`questions.${index}.correct_answers`) || [];

  return (
    <div className="group relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
      {showRemove && (
        <button
          type="button"
          onClick={remove}
          className="absolute -top-2 -right-2 bg-white text-red-500 p-2 rounded-full shadow-md border border-red-100"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* Question Header */}
      <div className="flex gap-4 items-start mb-6">
        <input
          type="number"
          {...register(`questions.${index}.question_number`)}
          className="w-12 h-10 bg-indigo-600 text-white rounded-xl text-center font-bold"
        />
        <textarea
          {...register(`questions.${index}.text`)}
          rows={2}
          className="w-full text-lg font-medium border-none focus:ring-0"
          placeholder="Type question..."
        />
      </div>

      {/* Options List */}
      <div className="space-y-3 ml-16">
        {optionFields.map((opt, optIndex) => (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 p-2 rounded-xl border border-gray-50 bg-gray-50/50">
              <span className="text-xs font-black text-indigo-300 w-4">
                {String.fromCharCode(65 + optIndex)}
              </span>
              <input
                {...register(`questions.${index}.options.${optIndex}.text`)}
                className="flex-1 bg-transparent border-none text-sm focus:ring-0"
                placeholder="Option..."
              />
              {optionFields.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(optIndex)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => appendOption({ text: "" })}
          className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider"
        >
          <Plus size={12} /> Add Option
        </button>
      </div>

      {/* Multi-select Correct Answers */}
      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between ml-16">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-2">
          <Check size={14} className="text-emerald-500" /> Correct (Multiple):
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {optionFields.map((_, i) => {
            const letter = String.fromCharCode(65 + i);
            const isChecked = correctAnswers.includes(letter);
            return (
              <label key={i} className="cursor-pointer">
                <input
                  type="checkbox"
                  value={letter}
                  {...register(`questions.${index}.correct_answers`)}
                  className="hidden"
                />
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                    isChecked
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {letter}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
