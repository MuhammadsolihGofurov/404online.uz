import React, { useRef } from "react";
import { PlusCircle } from "lucide-react";

export default function SmartTextarea({
  name,
  title,
  register,
  watch,
  setValue,
  questionType,
}) {
  const textareaRef = useRef(null);
  const textValue = watch(name) || "";

  const prefixMap = {
    MAP_DIAGRAM: "zone_",
    MATCHING: "match_",
    MCQ: "gap_",
  };

  const addGap = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Matndagi barcha gap/zone/match raqamlarini topamiz
    const matches = textValue.match(/{{(?:gap_|zone_|match_)(\d+)}}/g) || [];

    let nextNumber = 1;
    if (matches.length > 0) {
      // Eng oxirgi qo'shilgan gapning raqamini olamiz va 1 qo'shamiz
      const lastMatch = matches[matches.length - 1];
      const lastNumber = parseInt(lastMatch.match(/\d+/)[0]);
      nextNumber = lastNumber + 1;
    }

    const prefix = prefixMap[questionType] || "gap_";
    const gapTag = `{{${prefix}${nextNumber}}}`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText =
      textValue.substring(0, start) + gapTag + textValue.substring(end);

    setValue(name, newText, { shouldValidate: true });

    // Kursorni gapdan keyinga surib qo'yamiz
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + gapTag.length, start + gapTag.length);
    }, 10);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="font-semibold text-gray-700 text-sm">{title}</label>
        <button
          type="button"
          onClick={addGap}
          className="flex items-center gap-1 text-xs bg-blue-50 text-main px-2 py-1 rounded-md hover:bg-blue-100 transition-all border border-blue-200"
        >
          <PlusCircle size={14} />
          Insert Gap (Slot)
        </button>
      </div>

      <textarea
        {...register(name)}
        ref={(e) => {
          register(name).ref(e);
          textareaRef.current = e;
        }}
        rows={5}
        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-main outline-none text-sm leading-relaxed"
        placeholder="Type your text here..."
      />
      <p className="text-[10px] text-gray-400 italic">
        Tip: Click "Insert Gap" to add a placeholder where the student will
        select an answer.
      </p>
    </div>
  );
}
