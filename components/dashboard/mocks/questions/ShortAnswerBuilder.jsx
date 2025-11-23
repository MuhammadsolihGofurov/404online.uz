import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ShortAnswerBuilder({
  content,
  correctAnswer,
  questionNumberStart = 1,
  questionNumberEnd = 1,
  onContentChange,
  onAnswerChange,
}) {
  const isGrouped = questionNumberEnd > questionNumberStart;
  const variants = content?.variants || [];

  const updateContent = (key, value) => {
    onContentChange({ ...content, [key]: value });
  };

  const updateVariant = (index, value) => {
    const copy = [...variants];
    copy[index] = value;
    updateContent("variants", copy);
  };

  const addVariant = () => {
    updateContent("variants", [...variants, ""]);
  };

  const removeVariant = (index) => {
    updateContent(
      "variants",
      variants.filter((_, idx) => idx !== index)
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Instructions
          </label>
          <textarea
            rows={3}
            value={content?.instructions || ""}
            onChange={(e) => updateContent("instructions", e.target.value)}
            placeholder="e.g., Write NO MORE THAN THREE WORDS AND/OR A NUMBER."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Answer length limit
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={content?.answer_length_limit || ""}
            onChange={(e) =>
              updateContent("answer_length_limit", Number(e.target.value))
            }
            placeholder="3"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Text before answer
          </label>
          <input
            type="text"
            value={content?.pre_text || ""}
            onChange={(e) => updateContent("pre_text", e.target.value)}
            placeholder="e.g., The journey lasts"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Text after answer
          </label>
          <input
            type="text"
            value={content?.post_text || ""}
            onChange={(e) => updateContent("post_text", e.target.value)}
            placeholder="e.g., hours."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
      </div>

      {/* Statements for grouped questions */}
      {isGrouped && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Sub-question statements (optional)
            </label>
            {(!content?.statements || content.statements.length === 0) && (
              <button
                type="button"
                onClick={() => {
                  const newStatements = [];
                  for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
                    newStatements.push("");
                  }
                  updateContent("statements", newStatements);
                }}
                className="text-sm text-main hover:underline"
              >
                Add statements
              </button>
            )}
          </div>
          {content?.statements && content.statements.length > 0 && (
            <div className="space-y-2">
              {content.statements.map((stmt, idx) => {
                const qNum = questionNumberStart + idx;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 min-w-[40px]">
                      Q{qNum}:
                    </span>
                    <input
                      type="text"
                      value={stmt}
                      onChange={(e) => {
                        const newStatements = [...content.statements];
                        newStatements[idx] = e.target.value;
                        updateContent("statements", newStatements);
                      }}
                      placeholder={`Statement for Q${qNum}`}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/20"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Correct answers section */}
      {isGrouped ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">
            Correct answers (Q{questionNumberStart}-{questionNumberEnd})
          </p>
          {(() => {
            const questionRange = [];
            for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
              questionRange.push(i);
            }
            const statements = content?.statements || [];
            const currentValues = correctAnswer?.values || {};

            return questionRange.map((qNum) => (
              <div key={qNum}>
                <label className="text-sm font-medium text-slate-700">
                  Q{qNum} {statements[qNum - questionNumberStart] && (
                    <span className="text-slate-500 font-normal">
                      - {statements[qNum - questionNumberStart]}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={currentValues[String(qNum)] || ""}
                  onChange={(e) => {
                    const newValues = { ...currentValues };
                    newValues[String(qNum)] = e.target.value;
                    onAnswerChange({ values: newValues });
                  }}
                  placeholder={`Model answer for Q${qNum}`}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
                />
              </div>
            ));
          })()}
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-slate-700">
            Correct answer
          </label>
          <input
            type="text"
            value={correctAnswer?.value || ""}
            onChange={(e) => onAnswerChange({ value: e.target.value })}
            placeholder="Exact or model answer"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            Accepted variants
          </label>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/10"
          >
            <Plus size={14} />
            Add variant
          </button>
        </div>
        {variants.length === 0 && (
          <p className="text-sm text-slate-500">
            Add alternative answers if multiple spellings or synonyms are
            accepted.
          </p>
        )}
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={`${variant}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <input
                type="text"
                value={variant}
                onChange={(e) => updateVariant(index, e.target.value)}
                placeholder="Variant answer"
                className="flex-1 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

