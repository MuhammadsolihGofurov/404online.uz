import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { Save, Trash2, Hash } from "lucide-react";
import GeneratorActionCards from "./generation-action-card";
import { toast } from "react-toastify";
import useSWR from "swr";
import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import fetcher from "@/utils/fetcher";
import { useDispatch } from "react-redux";
import { setPartData } from "@/redux/slice/settings";

export default function MatchingInfoGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
  partId,
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { findParams } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [groupInfo, setGroupInfo] = useState(null);

  // Paragraf harflari (odatda A-H gacha)
  const paragraphOptions = ["A", "B", "C", "D", "E", "F", "G", "H"];
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

  const extractParagraphs = (htmlText) => {
    if (!htmlText) return ["A", "B", "C", "D"];

    const plainText = htmlText
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");

    const regex = /(?:Paragraph|Section|Part)?\s?\b([A-H])\b[:.]?/gi;

    let matches = [];
    let match;
    while ((match = regex.exec(plainText)) !== null) {
      matches.push(match[1].toUpperCase());
    }

    const uniqueLetters = [...new Set(matches)].sort();

    return uniqueLetters.length > 0 ? uniqueLetters : ["A", "B", "C", "D"];
  };
  const { data: partInfo } = useSWR(
    partId
      ? [`/editor/${sectionType}-${groupValue}/`, router.locale, partId]
      : null,
    ([url, locale, iid]) =>
      fetcher(
        `${url}${iid}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const fullText = watch("full_text");

  const dynamicParagraphs = React.useMemo(() => {
    return extractParagraphs(fullText);
  }, [fullText]);

  useEffect(() => {
    dispatch(setPartData(partInfo));
  }, [partId, partInfo]);

  //   group info
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (groupId) {
          const res = await authAxios.get(
            `/editor/${sectionType}-groups/${groupId}/`
          );
          const gData = res.data;
          setGroupInfo(gData);

          // AGAR yangi savol qo'shilayotgan bo'lsa (id yo'q bo'lsa)
          if (!id) {
            // Ustuvorlik: Group text_content > Part text_content
            const finalPlaceholderText =
              gData.text_content || partInfo?.text_content || "";
            setValue("full_text", finalPlaceholderText);
          }
        }
      } catch (err) {
        console.error("Error fetching group options:", err);
      }
    };

    if (partInfo) {
      // PartInfo kelganidan keyin tekshiramiz
      fetchGroupData();
    }
  }, [groupId, sectionType, partInfo, id, setValue]);

  // --- INITIAL DATA (EDIT) ---
  useEffect(() => {
    if (id && initialData) {
      setValue(
        "full_text",
        groupInfo?.text_content || partInfo?.text_content || ""
      );
      const qNum = initialData.question_number;
      const metadata = initialData.metadata?.[`gap_${qNum}`] || {};
      const answer = initialData.correct_answer?.[`gap_${qNum}`]?.[0] || "";

      replace([
        {
          question_number: qNum,
          question_text: metadata.question_text || "",
          answer: answer,
        },
      ]);
    }
  }, [id, initialData, setValue, replace]);

  const handleAIProcess = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    try {
      const data = await scanIELTSWithGemini(files, "matching-info");
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
          text: values.full_text,
          group: groupId,
          correct_answer: { [`gap_${q.question_number}`]: [q.answer] },
          metadata: {
            [`gap_${q.question_number}`]: {
              type: "matching_info",
              question_text: q.question_text,
            },
          },
        };
        return id
          ? authAxios.patch(`/editor/${sectionType}-questions/${id}/`, payload)
          : authAxios.post(`/editor/${sectionType}-questions/`, payload);
      });

      await Promise.all(requests);
      toast.success("Saved!");
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.error("Error saving");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              answer: "A",
            })
          }
          scanLabel="AI Matching Info Scanner"
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PASSAGE */}
        <div className="lg:w-1/2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Reading Passage (HTML View)
            </label>
            <div className="flex gap-2">
              {groupInfo?.text_content ? (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold border border-indigo-100">
                  GROUP SOURCE
                </span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold border border-amber-100">
                  PART SOURCE
                </span>
              )}
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">
                READ-ONLY
              </span>
            </div>
          </div>

          {/* HTML render qiluvchi asosiy konteyner */}
          <div className="flex-1 overflow-y-auto border border-gray-50 rounded-2xl bg-slate-50/50 p-4 min-h-[500px] max-h-[600px] prose prose-slate prose-sm max-w-none">
            {watch("full_text") ? (
              <div
                dangerouslySetInnerHTML={{ __html: watch("full_text") }}
                className="text-gray-700 leading-relaxed"
              />
            ) : (
              <p className="text-gray-400 italic text-sm">
                No content available to display.
              </p>
            )}
          </div>

          {/* Backend-ga yuborish uchun yashirin maydon */}
          <input type="hidden" {...register("full_text")} />
        </div>

        {/* QUESTIONS */}
        <div className="lg:w-1/2 space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-4"
            >
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  {...register(`questions.${index}.question_number`)}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-xl text-center font-bold"
                />
              </div>

              <div className="flex-1 space-y-3">
                <textarea
                  {...register(`questions.${index}.question_text`)}
                  rows={2}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter the statement found in a paragraph..."
                />

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Select Paragraph:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {/* BU YERDA: Dinamik paragraflarni chiqaramiz */}
                    {dynamicParagraphs.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setValue(`questions.${index}.answer`, opt)
                        }
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all border-2 ${
                          watch(`questions.${index}.answer`) === opt
                            ? "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-110"
                            : "bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="ml-auto p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Agar savol bo'lmasa ko'rsatiladigan placeholder */}
          {fields.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl">
              <p className="text-gray-400 text-sm italic">
                No questions added yet. Use the "Add" button or AI Scan.
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
      >
        <Save size={20} /> {isSubmitting ? "Saving..." : "Save Matching Info"}
      </button>
    </div>
  );
}
