import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { Save, Trash2, Plus, Info } from "lucide-react";
import { toast } from "react-toastify";
import useSWR from "swr";
import { useRouter } from "next/router";
import fetcher from "@/utils/fetcher";

export default function MatchingEndingGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
  partId,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]); // Endings list (A, B, C...)
  const router = useRouter();

  const { register, control, handleSubmit, setValue, replace, watch } = useForm(
    {
      defaultValues: {
        full_text: "", // Passage content
        questions: [], // { question_number, question_stem, answer }
      },
    }
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  // 1. Guruh ma'lumotlarini va Ending variantlarini olish
  useEffect(() => {
    const fetchGroupData = async () => {
      if (groupId) {
        try {
          const res = await authAxios.get(
            `/editor/${sectionType}-groups/${groupId}/`
          );
          // IELTSda Endings odatda "common_options" ichida saqlanadi
          setGroupOptions(res.data.common_options || []);

          if (!id) {
            setValue("full_text", res.data.text_content || "");
          }
        } catch (err) {
          toast.error("Error fetching group options");
        }
      }
    };
    fetchGroupData();
  }, [groupId, id, setValue, sectionType]);

  // 2. Edit rejimi uchun
  useEffect(() => {
    if (id && initialData) {
      const qNum = initialData.question_number;
      const metadata = initialData.metadata?.[`gap_${qNum}`] || {};

      setValue("full_text", initialData.text || "");
      replace([
        {
          question_number: qNum,
          question_stem: metadata.question_text || "",
          answer: initialData.correct_answer?.[`gap_${qNum}`]?.[0] || "",
        },
      ]);
    }
  }, [id, initialData, replace, setValue]);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const requests = values.questions.map((q) => {
        const payload = {
          question_number: parseInt(q.question_number),
          text: values.full_text,
          group: groupId,
          correct_answer: { [`gap_${q.question_number}`]: [q.answer] },
          metadata: {
            [`gap_${q.question_number}`]: {
              type: "matching_ending",
              question_text: q.question_stem, // Gapning boshi
            },
          },
        };
        return id
          ? authAxios.patch(`/editor/${sectionType}-questions/${id}/`, payload)
          : authAxios.post(`/editor/${sectionType}-questions/`, payload);
      });

      await Promise.all(requests);
      toast.success("Matching Endings saved!");
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* CHAP TOMON: Passage (Read Only) */}
        <div className="lg:w-1/3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h4 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Info size={14} /> Reading Passage
          </h4>
          <div
            className="flex-1 overflow-y-auto prose prose-slate prose-sm max-h-[600px] p-4 bg-slate-50 rounded-2xl border border-gray-50"
            dangerouslySetInnerHTML={{ __html: watch("full_text") }}
          />
        </div>

        {/* O'NG TOMON: Questions and Ending Selectors */}
        <div className="lg:w-2/3 space-y-4">
          <div className="bg-indigo-900 rounded-2xl p-4 text-white shadow-lg mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <span className="bg-white text-indigo-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                !
              </span>
              Available Endings (from Group Options)
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {groupOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-indigo-800/50 border border-indigo-700 px-3 py-1 rounded-lg text-sm"
                >
                  <span className="font-bold text-indigo-300">
                    {opt.split(".")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 transition-all hover:border-indigo-300"
            >
              <div className="flex items-start gap-4">
                <input
                  type="number"
                  {...register(`questions.${index}.question_number`)}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-xl text-center font-bold"
                />
                <div className="flex-1">
                  <textarea
                    {...register(`questions.${index}.question_stem`)}
                    placeholder="Enter sentence stem (the beginning of the sentence)..."
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 border-t pt-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Select Correct Ending:
                </span>
                <div className="flex flex-wrap gap-2">
                  {groupOptions.map((opt) => {
                    const letter = opt.split(".")[0].trim(); // "A. Something" -> "A"
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() =>
                          setValue(`questions.${index}.answer`, letter)
                        }
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all border-2 ${
                          watch(`questions.${index}.answer`) === letter
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-white border-gray-100 text-gray-400 hover:border-indigo-200"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="ml-auto text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              append({
                question_number: fields.length + 1,
                question_stem: "",
                answer: "",
              })
            }
            className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-500 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Sentence Stem
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
      >
        <Save size={20} />{" "}
        {isSubmitting ? "Saving..." : "Save Matching Endings"}
      </button>
    </div>
  );
}
