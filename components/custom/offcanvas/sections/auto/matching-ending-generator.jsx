import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { Save, Trash2, Plus, FileText } from "lucide-react";
import GeneratorActionCards from "./generation-action-card";
import { toast } from "react-toastify";
import useSWR from "swr";
import { useRouter } from "next/router";
import fetcher from "@/utils/fetcher";
import { useDispatch } from "react-redux";
import { setPartData } from "@/redux/slice/settings";

export default function MatchingEndingGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
  partId,
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const [groupInfo, setGroupInfo] = useState(null);

  const groupValue = sectionType === "listening" ? "parts" : "passages";

  const { register, control, handleSubmit, setValue, replace, watch } = useForm(
    {
      defaultValues: {
        full_text: "",
        questions: [],
      },
    }
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const { data: partInfo } = useSWR(
    partId
      ? [`/editor/${sectionType}-${groupValue}/`, router.locale, partId]
      : null,
    ([url, locale, iid]) =>
      fetcher(
        `${url}${iid}`,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  useEffect(() => {
    if (partInfo) dispatch(setPartData(partInfo));
  }, [partInfo, dispatch]);

  // Guruh ma'lumotlarini (Common Options/Endings) olish
  useEffect(() => {
    const fetchGroupData = async () => {
      if (groupId) {
        try {
          const res = await authAxios.get(
            `/editor/${sectionType}-groups/${groupId}/`
          );
          setGroupInfo(res.data);
          if (!id) {
            setValue(
              "full_text",
              res.data.text_content || partInfo?.text_content || ""
            );
          }
        } catch (err) {
          console.error("Group fetch error:", err);
        }
      }
    };
    if (partInfo) fetchGroupData();
  }, [groupId, sectionType, partInfo, id, setValue]);

  // EDIT rejimi
  useEffect(() => {
    if (id && initialData) {
      setValue("full_text", initialData.text || "");
      const qNum = initialData.question_number;
      const metadata = initialData.metadata?.[`gap_${qNum}`] || {};
      const answer = initialData.correct_answer?.[`gap_${qNum}`]?.[0] || "";

      replace([
        {
          question_number: qNum,
          question_text: metadata.question_text || "", // Gapning boshi (stem)
          answer: answer,
        },
      ]);
    }
  }, [id, initialData, setValue, replace]);

  const handleAIProcess = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    try {
      const data = await scanIELTSWithGemini(files, "MATCH_ENDING");
      setValue("full_text", data.full_text || "");
      const formatted = (data.questions || []).map((q) => ({
        question_number: q.number,
        question_text: q.text,
        answer: q.answer,
      }));
      replace(formatted);
    } catch (err) {
      toast.error("AI scan failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const requests = values.questions.map((q) => {
        const payload = {
          question_number: parseInt(q.question_number),
          text: values.full_text, // Passage matni
          group: groupId,
          correct_answer: { [`gap_${q.question_number}`]: [q.answer] },
          metadata: {
            [`gap_${q.question_number}`]: {
              type: "matching_ending",
              question_text: q.question_text, // Sentence stem
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
      toast.error("Error saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guruhdan kelgan harfli variantlarni (A, B, C...) ajratib olish
  const endingOptions = groupInfo?.common_options?.map((opt) =>
    opt.split(".")[0].trim()
  ) || ["A", "B", "C", "D"];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {!id && (
        <GeneratorActionCards
          loading={loading}
          onScan={handleAIProcess}
          onAdd={() =>
            append({
              question_number: fields.length + 1,
              question_text: "",
              answer: "",
            })
          }
          scanLabel="AI Matching Ending Scanner"
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PASSAGE (LEFT) */}
        <div className="lg:w-1/2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <label className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">
            Reading Passage
          </label>
          <div className="flex-1 overflow-y-auto border border-gray-50 rounded-2xl bg-slate-50/50 p-4 max-h-[600px] prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: watch("full_text") }} />
          </div>
        </div>

        {/* QUESTIONS (RIGHT) */}
        <div className="lg:w-1/2 space-y-4">
          {/* Helper: List of Endings */}
          <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-sm mb-4">
            <h5 className="text-[10px] font-bold uppercase opacity-60 mb-2">
              Available Endings (Common Options):
            </h5>
            <div className="flex flex-wrap gap-2">
              {groupInfo?.common_options?.map((opt, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-indigo-800 px-2 py-1 rounded-md border border-indigo-700"
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 transition-all hover:border-indigo-300"
            >
              <div className="flex gap-4">
                <input
                  type="number"
                  {...register(`questions.${index}.question_number`)}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-xl text-center font-bold"
                />
                <textarea
                  {...register(`questions.${index}.question_text`)}
                  rows={2}
                  className="flex-1 bg-gray-50 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter sentence stem (e.g., The team's research...)"
                />
              </div>

              <div className="flex items-center gap-3 border-t pt-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Select Ending:
                </span>
                <div className="flex flex-wrap gap-2">
                  {endingOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setValue(`questions.${index}.answer`, opt)}
                      className={`w-10 h-10 rounded-xl text-sm font-black border-2 transition-all ${
                        watch(`questions.${index}.answer`) === opt
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-110"
                          : "bg-white border-gray-100 text-gray-400 hover:border-indigo-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
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
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
      >
        <Save size={20} />{" "}
        {isSubmitting ? "Saving..." : "Save Matching Endings"}
      </button>
    </div>
  );
}
