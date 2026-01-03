import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { Save, Trash2, Plus, MessageSquare } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import GeneratorActionCards from "./generation-action-card";
import { Select } from "@/components/custom/details";

export default function ShortAnswerGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
  question_Type = "short-answer",
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      full_text: "", // Passage/Matn
      questions: [],
      ui_type: "short_answer",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "questions",
  });

  // --- INITIAL DATA (EDIT MODE) ---
  useEffect(() => {
    if (id && initialData) {
      setValue("full_text", initialData.text || "");
      const questionNum = initialData.question_number;
      const metadata = initialData.metadata?.[`gap_${questionNum}`] || {};

      setValue("ui_type", metadata.type || "short_answer");

      replace([
        {
          question_number: questionNum,
          question_text: metadata.question_text || "", // Savolning o'zi
          correct_answers: (
            initialData.correct_answer?.[`gap_${questionNum}`] || []
          ).join(", "),
          max_words: metadata.max_words || 1,
        },
      ]);
    }
  }, [id, initialData, setValue, replace]);

  // --- MANUAL ADD QUESTION ---
  const addQuestion = () => {
    const lastNum =
      fields.length > 0
        ? Math.max(...fields.map((q) => parseInt(q.question_number) || 0))
        : 0;

    append({
      question_number: lastNum + 1,
      question_text: "",
      correct_answers: "",
      max_words: 1,
    });
  };

  // --- AI SCANNER ---
  const handleProcessImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const toastId = toast.loading("AI is scanning questions...");

    try {
      const data = await scanIELTSWithGemini(files, question_Type);

      // AI dan kelgan matn va savollarni joylaymiz
      setValue("full_text", data.full_text || "");

      const formatted = (data.questions || []).map((q) => ({
        question_number: q.number,
        question_text: q.text,
        correct_answers: Array.isArray(q.answer)
          ? q.answer.join(", ")
          : q.answer,
        max_words: q.max_words || 1,
      }));

      replace(formatted);
      toast.update(toastId, {
        render: "Successfully extracted!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: "AI failed to scan",
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
      const requests = values.questions.map((q) => {
        const payload = {
          question_number: parseInt(q.question_number),
          // Reading bo'lsa passage, Listening bo'lsa transcript
          text: values.full_text,
          group: groupId,
          correct_answer: {
            [`gap_${q.question_number}`]: q.correct_answers
              .split(",")
              .map((a) => a.trim()),
          },
          metadata: {
            [`gap_${q.question_number}`]: {
              type: values.ui_type, // short_answer
              question_text: q.question_text, // Savolning o'zi bu yerda
              max_words: parseInt(q.max_words) || 1,
            },
          },
        };

        // Dinamik endpoint: reading-questions yoki listening-questions
        return id
          ? authAxios.patch(`/editor/${sectionType}-questions/${id}/`, payload)
          : authAxios.post(`/editor/${sectionType}-questions/`, payload);
      });

      await Promise.all(requests);
      toast.update(toastId, {
        render: "Success!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.update(toastId, {
        render: "Error saving",
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
        <GeneratorActionCards
          loading={loading}
          onScan={handleProcessImages}
          onAdd={addQuestion}
          scanLabel="AI Short Answer Scanner"
          addLabel="Add Question"
          addSubLabel="Direct question & answer"
        />
      )}

      <div className="mb-6 bg-white p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
        <span className="text-sm font-bold text-gray-500 uppercase">
          UI Type:
        </span>
        <div className="w-64">
          <Controller
            name="ui_type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { label: "Short Answer", value: "short_answer" },
                  { label: "List Completion", value: "list_completion" },
                ]}
              />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PASSAGE AREA */}
        <div className="lg:w-1/2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
            {sectionType === "listening"
              ? "Audio Transcript"
              : "Reading Passage"}
          </label>
          <textarea
            {...register("full_text")}
            className="w-full h-[500px] text-base leading-relaxed border-none focus:ring-0 p-0 resize-none text-gray-700"
            placeholder="Paste the reading passage here..."
          />
        </div>

        {/* QUESTIONS LIST */}
        <div className="lg:w-1/2 space-y-4 max-h-[550px] overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 shadow-sm animate-in slide-in-from-right-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    {...register(`questions.${index}.question_number`)}
                    className="w-10 h-10 bg-emerald-600 text-white rounded-lg text-center font-bold text-sm border-none"
                  />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    Question Content
                  </span>
                </div>
                {!id && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  {...register(`questions.${index}.question_text`)}
                  rows={2}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 font-medium"
                  placeholder="Enter the question (e.g. What year was the building finished?)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Correct Answer(s)
                    </span>
                    <input
                      {...register(`questions.${index}.correct_answers`)}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500"
                      placeholder="Answer1, Answer2"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Word Limit
                    </span>
                    <input
                      type="number"
                      {...register(`questions.${index}.max_words`)}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all"
      >
        {isSubmitting ? "Saving..." : <Save size={20} />}
        {id ? "Update Short Answer" : "Save All Questions"}
      </button>
    </div>
  );
}
