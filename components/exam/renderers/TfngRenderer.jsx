import React, { useCallback, memo } from "react";
import { RichText } from "@/components/ui/RichText";

export const TfngRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, question_number_start, question_number_end, content } = question;
  const start = parseInt(question_number_start) || question.question_number;
  const end = parseInt(question_number_end) || question.question_number;
  const range = [];
  for (let i = start; i <= end; i++) range.push(i);

  const options = [
    { key: "TRUE", label: "TRUE" },
    { key: "FALSE", label: "FALSE" },
    { key: "NOT GIVEN", label: "NOT GIVEN" }
  ];

  const handleChange = useCallback((qNum, val) => {
    const currentValues = value?.values || {};
    onChange({ values: { ...currentValues, [qNum]: val } });
  }, [value, onChange]);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">
          Q{start}-{end}
        </span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-16 space-y-4">
        {range.map((qNum, idx) => {
          const statement = content?.statements?.[idx] || `Question ${qNum}`;
          const qVal = value?.values?.[qNum] || "";

          return (
            <div key={qNum} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <span className="font-bold text-blue-600 min-w-[2rem] text-lg">{qNum}</span>
                <div className="text-gray-800 font-medium leading-relaxed"><RichText content={statement} /></div>
              </div>
              <div className="flex gap-2 shrink-0 self-end sm:self-center">
                {options.map(opt => (
                  <label key={opt.key} className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer border transition-all shadow-sm ${qVal === opt.key ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}`}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name={`tfng-${question.id}-${qNum}`}
                      value={opt.key}
                      checked={qVal === opt.key}
                      onChange={() => !disabled && handleChange(qNum, opt.key)}
                      disabled={disabled}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TfngRenderer.displayName = "TfngRenderer";

