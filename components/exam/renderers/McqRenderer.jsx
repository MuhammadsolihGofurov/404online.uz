import React, { useMemo, useCallback, memo } from "react";
import { RichText } from "@/components/ui/RichText";
import { safeText } from "./utils";

export const McqRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, content, question_number_start, question_number_end } = question;
  const options = content?.options || [];
  const isMultiple = question.question_type === "MCQ_MULTIPLE";
  
  // Loop Logic
  const start = parseInt(question_number_start) || question.question_number;
  const end = parseInt(question_number_end) || question.question_number;
  const range = [];
  for (let i = start; i <= end; i++) range.push(i);

  // Helper to normalize options
  const normalizedOptions = useMemo(() => options.map((opt, idx) => ({
    key: safeText(opt.id || opt.key || idx),
    label: safeText(opt.text || opt.label || opt),
    value: safeText(opt.value || opt.id || idx)
  })), [options]);

  const handleChange = useCallback((qNum, newVal) => {
    if (start === end) {
      // Single Question
      onChange({ value: newVal });
    } else {
      // Grouped
      const currentValues = value?.values || {};
      onChange({ values: { ...currentValues, [qNum]: newVal } });
    }
  }, [start, end, value, onChange]);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">
          {start === end ? `Q${start}` : `Q${start}-${end}`}
        </span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-16 space-y-10">
        {range.map(qNum => {
          const subQ = content?.questions?.find(q => String(q.id) === String(qNum));
          const subPrompt = subQ?.text || (range.length > 1 ? `Question ${qNum}` : null);
          const qVal = start === end ? (value?.value || "") : (value?.values?.[qNum] || "");

          return (
            <div key={qNum} className="space-y-4">
              {subPrompt && range.length > 1 && (
                 <div className="font-semibold text-gray-800 text-md border-l-4 border-blue-200 pl-3 py-1">
                   <RichText content={subPrompt} />
                 </div>
              )}
              <div className="space-y-3">
                {normalizedOptions.map(opt => {
                  const isChecked = isMultiple 
                    ? Array.isArray(qVal) && qVal.includes(opt.value)
                    : qVal === opt.value;
                  
                  return (
                    <label key={opt.key} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                      <div className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded-full border ${isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                        {isChecked && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input 
                        type={isMultiple ? "checkbox" : "radio"}
                        name={`q-${question.id}-${qNum}`}
                        value={opt.value}
                        checked={isChecked}
                        onChange={(e) => {
                          if (disabled) return;
                          if (isMultiple) {
                            const currentArr = Array.isArray(qVal) ? qVal : [];
                            const newArr = e.target.checked 
                              ? [...currentArr, opt.value]
                              : currentArr.filter(v => v !== opt.value);
                            handleChange(qNum, newArr);
                          } else {
                            handleChange(qNum, opt.value);
                          }
                        }}
                        disabled={disabled}
                        className="hidden" // Hide default input, use custom UI above
                      />
                      <span className="text-gray-700 leading-relaxed"><RichText content={opt.label} /></span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

McqRenderer.displayName = "McqRenderer";

