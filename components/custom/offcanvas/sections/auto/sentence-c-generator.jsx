import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { Save, Trash2, MousePointer2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import GeneratorActionCards from "./generation-action-card";
import { Select } from "@/components/custom/details";
// Select komponentingizni import qiling

export default function SentenceCompletionGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
  question_Type,
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const { register, control, handleSubmit, watch, setValue, getValues } =
    useForm({
      defaultValues: {
        full_text: "",
        questions: [],
        ui_type: "text_input", // Metadata uchun asosiy type
      },
    });

  const { fields, replace } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedText = watch("full_text");

  // --- 1. SINXRONIZATSIYA MANTIQI ---
  // Matn ichidagi [n] larni kuzatib, savollar ro'yxatini avtomatik yangilaydi
  useEffect(() => {
    if (id) return; // Edit rejimida auto-sync o'chiriladi

    const regex = /\[(\d+)\]/g;
    const matches = [...watchedText.matchAll(regex)];
    const foundNumbers = matches.map((m) => parseInt(m[1]));

    const currentQuestions = getValues("questions");

    // Faqat o'zgargan bo'lsa yangilash
    const newQuestions = foundNumbers.map((num) => {
      const existing = currentQuestions.find((q) => q.question_number === num);
      return (
        existing || { question_number: num, correct_answers: "", max_words: 1 }
      );
    });

    const isDifferent =
      JSON.stringify(foundNumbers) !==
      JSON.stringify(currentQuestions.map((q) => q.question_number));

    if (isDifferent) {
      replace(newQuestions);
    }
  }, [watchedText, replace, getValues, id]);

  // --- INITIAL DATA (EDIT MODE) ---
  useEffect(() => {
    if (id && initialData) {
      const questionNum = initialData.question_number;
      const displayFriendlyText = initialData.text.replace(
        `{{gap_${questionNum}}}`,
        `[${questionNum}]`
      );

      setValue("full_text", displayFriendlyText);
      const metadata = initialData.metadata?.[`gap_${questionNum}`] || {};
      setValue("ui_type", metadata.type || "text_input");

      replace([
        {
          question_number: questionNum,
          correct_answers: (
            initialData.correct_answer?.[`gap_${questionNum}`] || []
          ).join(", "),
          max_words: metadata.max_words || 1,
        },
      ]);
    }
  }, [id, initialData, setValue, replace]);

  // --- INTERACTIVE INSERTION ---
  const insertGap = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = getValues("full_text");

    // Matndagi eng katta raqamni topib, +1 qo'shish
    const regex = /\[(\d+)\]/g;
    const matches = [...currentText.matchAll(regex)];
    const existingNums = matches.map((m) => parseInt(m[1]));
    const nextNumber =
      existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    const displayTag = `[${nextNumber}]`;
    const newText =
      currentText.substring(0, start) + displayTag + currentText.substring(end);

    setValue("full_text", newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + displayTag.length,
        start + displayTag.length
      );
    }, 10);
  };

  // --- AI SCANNER ---
  const handleProcessImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const toastId = toast.loading("AI is scanning...");

    try {
      const data = await scanIELTSWithGemini(files, question_Type);
      const userFriendlyText = data.full_text.replace(/{{(\d+)}}/g, "[$1]");
      setValue("full_text", userFriendlyText);

      const formatted = (data.questions || []).map((q) => ({
        question_number: q.number,
        correct_answers: Array.isArray(q.answer)
          ? q.answer.join(", ")
          : q.answer,
        max_words: 1,
      }));

      replace(formatted);
      toast.update(toastId, {
        render: "Success!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: "AI failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Saving...");

    try {
      let finalMainText = values.full_text.replace(/\[(\d+)\]/g, "{{gap_$1}}");

      const requests = values.questions.map((q) => {
        let maskedText = finalMainText;
        if (!id) {
          values.questions.forEach((otherQ) => {
            if (otherQ.question_number !== q.question_number) {
              maskedText = maskedText.replace(
                `{{gap_${otherQ.question_number}}}`,
                "________"
              );
            }
          });
        }

        const payload = {
          question_number: parseInt(q.question_number),
          text: maskedText,
          group: groupId,
          correct_answer: {
            [`gap_${q.question_number}`]: q.correct_answers
              .split(",")
              .map((a) => a.trim()),
          },
          metadata: {
            [`gap_${q.question_number}`]: {
              type: values.ui_type, // Tanlangan type yuboriladi
              max_words: parseInt(q.max_words),
            },
          },
        };

        return id
          ? authAxios.patch(`/editor/${sectionType}-questions/${id}/`, payload)
          : authAxios.post(`/editor/${sectionType}-questions/`, payload);
      });

      await Promise.all(requests);
      toast.update(toastId, {
        render: "Saved!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.update(toastId, {
        render: "Error",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {!id && (
        <>
          <GeneratorActionCards
            loading={loading}
            onScan={handleProcessImages}
            onAdd={insertGap}
            scanLabel="AI Table Scanner"
            addLabel="Add Blank Gap"
            addSubLabel="Auto-syncs numbers"
          />
          {/* GLOBAL TYPE SELECTOR */}
          <div className="mb-6 bg-white p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
              Question Type:
            </span>
            <div className="w-64">
              <Controller
                name="ui_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { label: "Text Input (Sentence)", value: "text_input" },
                      { label: "Table Completion", value: "table" },
                      { label: "Summary Completion", value: "summary" },
                      { label: "Note Completion", value: "note" },
                    ]}
                  />
                )}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* TEXT AREA */}
        <div className="lg:w-2/3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <textarea
            {...register("full_text")}
            ref={(e) => {
              register("full_text").ref(e);
              textareaRef.current = e;
            }}
            className="w-full h-[500px] text-lg leading-loose border-none focus:ring-0 p-0 resize-none font-medium text-gray-700"
            placeholder="Type text... Use [1], [2] tags."
          />
        </div>

        {/* QUESTIONS LIST */}
        <div className="lg:w-1/3 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white p-5 rounded-2xl border-l-4 border-l-indigo-500 shadow-sm animate-in slide-in-from-right-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                  {watch(`questions.${index}.question_number`)}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Answer Config
                </span>
              </div>
              <div className="space-y-3">
                <input
                  {...register(`questions.${index}.correct_answers`)}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500"
                  placeholder="Answers..."
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Word Limit
                  </span>
                  <input
                    type="number"
                    {...register(`questions.${index}.max_words`)}
                    className="w-12 bg-transparent text-right text-xs font-black text-indigo-600 border-none p-0"
                  />
                </div>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-20 text-gray-300 italic text-sm">
              No gaps found in text.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting ? "Processing..." : <Save size={20} />}
        {id ? "Update Question" : "Save All Data"}
      </button>
    </div>
  );
}
