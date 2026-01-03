import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { Save, Trash2, GripVertical, Info } from "lucide-react";
import GeneratorActionCards from "./generation-action-card";
import { toast } from "react-toastify";

export default function MatchingHeadingsGenerator({
  groupId,
  sectionType,
  onClose,
  id = null,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, setValue } = useForm({
    defaultValues: {
      full_text: "",
      questions: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "questions",
  });

  // --- GROUP OPTIONS FETCHING ---
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (groupId) {
          const res = await authAxios.get(
            `/editor/${sectionType}-groups/${groupId}/`
          );
          setGroupOptions(res.data.common_options || []);
        }
      } catch (err) {
        console.error("Error fetching group options:", err);
      }
    };
    fetchGroupData();
  }, [groupId, sectionType]);

  // --- INITIAL DATA (EDIT MODE) ---
  useEffect(() => {
    if (id && initialData) {
      setValue("full_text", initialData.text || "");
      const qNum = initialData.question_number;
      const answer = initialData.correct_answer?.[`gap_${qNum}`]?.[0] || "";

      // Endi replace funksiyasi mavjud va ishlaydi
      replace([{ question_number: qNum, answer: answer }]);
    }
  }, [id, initialData, setValue, replace]);

  // --- DRAG & DROP HANDLERS ---
  const onDragStart = (e, optionValue) => {
    e.dataTransfer.setData("optionValue", optionValue);
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    const droppedValue = e.dataTransfer.getData("optionValue");
    // Faqat rim raqamini yoki heading indeksini olish (i, ii, iii)
    const shortValue = droppedValue.split(".")[0].trim();
    setValue(`questions.${index}.answer`, shortValue);
  };

  const handleAIProcess = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    try {
      const data = await scanIELTSWithGemini(files, "matching");
      setValue("full_text", data.full_text || "");
      const formatted = (data.questions || []).map((q) => ({
        question_number: q.number,
        answer: q.answer,
      }));
      replace(formatted);
    } catch (err) {
      toast.error("AI scanning failed");
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
            [`gap_${q.question_number}`]: { type: "matching_heading" },
          },
        };
        return id
          ? authAxios.patch(`/editor/${sectionType}-questions/${id}/`, payload)
          : authAxios.post(`/editor/${sectionType}-questions/`, payload);
      });

      await Promise.all(requests);
      toast.success("Saved successfully!");
      if (onClose) onClose("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.error("Save failed");
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
            append({ question_number: fields.length + 1, answer: "" })
          }
          scanLabel="AI Headings Scanner"
        />
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Passage & Headings List */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
            <h4 className="text-xs font-black text-indigo-900 uppercase mb-3 flex items-center gap-2">
              <Info size={14} /> Available Headings (Drag these)
            </h4>
            <div className="space-y-2">
              {groupOptions.map((opt, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => onDragStart(e, opt)}
                  className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-medium cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <GripVertical size={14} className="text-indigo-400" />
                  {opt}
                </div>
              ))}
              {groupOptions.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  No options found in group settings.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Passage Input */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <textarea
            {...register("full_text")}
            className="w-full h-[500px] text-base leading-relaxed border-none focus:ring-0 p-0 resize-none text-gray-700"
            placeholder="Paste your passage here (Paragraphs A, B, C...)"
          />
        </div>

        {/* RIGHT: Questions & Drop Zones */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, index)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  type="number"
                  {...register(`questions.${index}.question_number`)}
                  className="w-12 h-8 bg-gray-100 rounded-lg text-center font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="relative group">
                <input
                  {...register(`questions.${index}.answer`)}
                  readOnly
                  placeholder="Drop Heading here"
                  className="w-full bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl p-3 text-center text-sm font-bold text-emerald-700 placeholder:text-emerald-300 pointer-events-none"
                />
                <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-emerald-500 font-bold">
                    READY TO DROP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
      >
        <Save size={20} />{" "}
        {isSubmitting ? "Saving..." : "Save Matching Headings"}
      </button>
    </div>
  );
}
