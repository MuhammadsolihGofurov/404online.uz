/**
 * TfngBuilder Component
 * Handles True/False/Not Given question type
 */

import React from "react";

export function TfngBuilder({
  questionNumberStart,
  questionNumberEnd,
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const options = [
    { value: "TRUE", label: "True" },
    { value: "FALSE", label: "False" },
    { value: "NOT GIVEN", label: "Not Given" },
  ];

  const isGrouped = questionNumberEnd > questionNumberStart;
  const statements = content?.statements || [];
  const currentValues = correctAnswer?.values || {};

  if (isGrouped) {
    const questionRange = [];
    for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
      questionRange.push(i);
    }

    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-700">
          Correct answers (Q{questionNumberStart}-{questionNumberEnd})
        </p>

        {/* Required: Sub-question statements */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Sub-question statements <span className="text-red-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Each sub-question must have a statement. These will be displayed to students.
          </p>
          {statements.map((stmt, idx) => {
            const qNum = questionNumberStart + idx;
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 min-w-[40px]">
                  Q{qNum}:
                </span>
                <input
                  type="text"
                  value={stmt || ""}
                  onChange={(e) => {
                    const newStatements = [...statements];
                    newStatements[idx] = e.target.value;
                    onContentChange({ ...content, statements: newStatements });
                  }}
                  placeholder={`Statement for Q${qNum}`}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/20"
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {questionRange.map((qNum) => {
            const currentValue = currentValues[String(qNum)] || "";
            return (
              <div key={qNum} className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Q{qNum} {statements[qNum - questionNumberStart] && (
                    <span className="font-normal text-slate-500">
                      - {statements[qNum - questionNumberStart]}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const newValues = { ...currentValues };
                        newValues[String(qNum)] = option.value;
                        onAnswerChange({ values: newValues });
                      }}
                      className={`flex-1 min-w-[120px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        currentValue === option.value
                          ? "border-main bg-main/10 text-main"
                          : "border-slate-200 text-slate-600 hover:border-main/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Single question (non-grouped)
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700">Correct answer</p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAnswerChange({ value: option.value })}
            className={`flex-1 min-w-[120px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              correctAnswer?.value === option.value
                ? "border-main bg-main/10 text-main"
                : "border-slate-200 text-slate-600 hover:border-main/60"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

