/**
 * ShortAnswerBuilder - Enhanced with Answer Variants Support
 * Allows admins to specify primary answer + acceptable alternatives
 * Supports both single questions and grouped question ranges
 */

import React, { useCallback, useMemo } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";

export default function ShortAnswerBuilder({
  content,
  correctAnswer,
  questionNumberStart = 1,
  questionNumberEnd = 1,
  onContentChange,
  onAnswerChange,
}) {
  const isGrouped = questionNumberEnd > questionNumberStart;

  // Helper to update content fields
  const updateContent = useCallback(
    (key, value) => {
      onContentChange({ ...content, [key]: value });
    },
    [content, onContentChange]
  );

  // ============= SINGLE QUESTION MODE =============
  const updateSinglePrimary = useCallback(
    (value) => {
      onAnswerChange({
        ...correctAnswer,
        primary: value,
      });
    },
    [correctAnswer, onAnswerChange]
  );

  const updateSingleAlternative = useCallback(
    (index, value) => {
      const alternatives = [...(correctAnswer?.alternatives || [])];
      alternatives[index] = value;
      onAnswerChange({
        ...correctAnswer,
        alternatives,
      });
    },
    [correctAnswer, onAnswerChange]
  );

  const addSingleAlternative = useCallback(() => {
    const alternatives = [...(correctAnswer?.alternatives || []), ""];
    onAnswerChange({
      ...correctAnswer,
      alternatives,
    });
  }, [correctAnswer, onAnswerChange]);

  const removeSingleAlternative = useCallback(
    (index) => {
      const alternatives = [...(correctAnswer?.alternatives || [])];
      alternatives.splice(index, 1);
      onAnswerChange({
        ...correctAnswer,
        alternatives,
      });
    },
    [correctAnswer, onAnswerChange]
  );

  const updateCaseSensitive = useCallback(
    (value) => {
      onAnswerChange({
        ...correctAnswer,
        is_case_sensitive: value,
      });
    },
    [correctAnswer, onAnswerChange]
  );

  // ============= GROUPED QUESTION MODE =============
  const updateGroupedPrimary = useCallback(
    (qNum, value) => {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[String(qNum)] || {};

      // Support both old format (string) and new format (object)
      if (typeof current === "string") {
        values[String(qNum)] = {
          primary: value,
          alternatives: [],
          is_case_sensitive: false,
        };
      } else {
        values[String(qNum)] = {
          ...current,
          primary: value,
        };
      }

      onAnswerChange({ values });
    },
    [correctAnswer, onAnswerChange]
  );

  const updateGroupedAlternative = useCallback(
    (qNum, index, value) => {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[String(qNum)] || {};

      const currentData =
        typeof current === "string"
          ? { primary: current, alternatives: [], is_case_sensitive: false }
          : current;

      const alternatives = [...(currentData.alternatives || [])];
      alternatives[index] = value;

      values[String(qNum)] = {
        ...currentData,
        alternatives,
      };

      onAnswerChange({ values });
    },
    [correctAnswer, onAnswerChange]
  );

  const addGroupedAlternative = useCallback(
    (qNum) => {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[String(qNum)] || {};

      const currentData =
        typeof current === "string"
          ? { primary: current, alternatives: [], is_case_sensitive: false }
          : current;

      const alternatives = [...(currentData.alternatives || []), ""];

      values[String(qNum)] = {
        ...currentData,
        alternatives,
      };

      onAnswerChange({ values });
    },
    [correctAnswer, onAnswerChange]
  );

  const removeGroupedAlternative = useCallback(
    (qNum, index) => {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[String(qNum)] || {};

      const currentData =
        typeof current === "string"
          ? { primary: current, alternatives: [], is_case_sensitive: false }
          : current;

      const alternatives = [...(currentData.alternatives || [])];
      alternatives.splice(index, 1);

      values[String(qNum)] = {
        ...currentData,
        alternatives,
      };

      onAnswerChange({ values });
    },
    [correctAnswer, onAnswerChange]
  );

  const updateGroupedCaseSensitive = useCallback(
    (qNum, value) => {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[String(qNum)] || {};

      const currentData =
        typeof current === "string"
          ? { primary: current, alternatives: [], is_case_sensitive: false }
          : current;

      values[String(qNum)] = {
        ...currentData,
        is_case_sensitive: value,
      };

      onAnswerChange({ values });
    },
    [correctAnswer, onAnswerChange]
  );

  // ============= RENDER ANSWER FIELDS =============
  const renderAnswerFields = useCallback(
    (qNum = null) => {
      const isGroupedMode = qNum !== null;
      let answerData, primary, alternatives, isCaseSensitive;

      if (isGroupedMode) {
        const current = correctAnswer?.values?.[String(qNum)] || {};
        // Handle backward compatibility
        if (typeof current === "string") {
          answerData = {
            primary: current,
            alternatives: [],
            is_case_sensitive: false,
          };
        } else {
          answerData = current;
        }
        primary = answerData.primary || "";
        alternatives = answerData.alternatives || [];
        isCaseSensitive = answerData.is_case_sensitive || false;
      } else {
        answerData = correctAnswer || {};
        primary = answerData.primary || "";
        alternatives = answerData.alternatives || [];
        isCaseSensitive = answerData.is_case_sensitive || false;
      }

      return (
        <div className="space-y-4">
          {/* Primary Answer */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Primary Answer (Model Answer)
              <span className="ml-2 text-xs text-slate-500">*Required</span>
            </label>
            <input
              type="text"
              value={primary}
              onChange={(e) => {
                if (isGroupedMode) {
                  updateGroupedPrimary(qNum, e.target.value);
                } else {
                  updateSinglePrimary(e.target.value);
                }
              }}
              placeholder="e.g., bus stop"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
            />
            <p className="mt-1 text-xs text-slate-500">
              This is the main correct answer that students should provide.
            </p>
          </div>

          {/* Alternatives Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Accepted Alternatives
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Add other valid spellings or synonyms (IELTS scoring)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isGroupedMode) {
                    addGroupedAlternative(qNum);
                  } else {
                    addSingleAlternative();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/10"
              >
                <Plus size={14} />
                Add Variant
              </button>
            </div>

            {alternatives.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-600">
                  💡 <strong>Tip:</strong> Add alternative answers if multiple
                  spellings are accepted.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Example: "bus stop" could also accept "bus-stop" or "bus
                  station"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alternatives.map((alternative, index) => (
                  <div
                    key={`alt-${qNum}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="text-xs font-medium text-slate-500 min-w-[60px]">
                      Variant {index + 1}:
                    </span>
                    <input
                      type="text"
                      value={alternative}
                      onChange={(e) => {
                        if (isGroupedMode) {
                          updateGroupedAlternative(qNum, index, e.target.value);
                        } else {
                          updateSingleAlternative(index, e.target.value);
                        }
                      }}
                      placeholder="e.g., bus-stop"
                      className="flex-1 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isGroupedMode) {
                          removeGroupedAlternative(qNum, index);
                        } else {
                          removeSingleAlternative(index);
                        }
                      }}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matching Settings */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Settings2 size={18} className="text-slate-600 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Matching Settings
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure how student answers are validated
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCaseSensitive}
                    onChange={(e) => {
                      if (isGroupedMode) {
                        updateGroupedCaseSensitive(qNum, e.target.checked);
                      } else {
                        updateCaseSensitive(e.target.checked);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-main focus:ring-main focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">
                      Case Sensitive
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isCaseSensitive ? (
                        <>
                          <strong>"Bus Stop"</strong> and{" "}
                          <strong>"bus stop"</strong> are treated as{" "}
                          <strong className="text-red-600">different</strong>
                        </>
                      ) : (
                        <>
                          <strong>"Bus Stop"</strong> and{" "}
                          <strong>"bus stop"</strong> are treated as{" "}
                          <strong className="text-green-600">the same</strong>
                        </>
                      )}
                    </p>
                  </div>
                </label>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    ℹ️ By default, extra whitespace is trimmed and punctuation
                    differences like "bus-stop" vs "bus stop" are accepted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [
      correctAnswer,
      updateSinglePrimary,
      updateGroupedPrimary,
      updateSingleAlternative,
      updateGroupedAlternative,
      addSingleAlternative,
      addGroupedAlternative,
      removeSingleAlternative,
      removeGroupedAlternative,
      updateCaseSensitive,
      updateGroupedCaseSensitive,
    ]
  );

  // Generate question range for grouped mode
  const questionRange = useMemo(() => {
    if (!isGrouped) return [];
    const range = [];
    for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
      range.push(i);
    }
    return range;
  }, [isGrouped, questionNumberStart, questionNumberEnd]);

  return (
    <div className="space-y-6">
      {/* Content Configuration Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-main">
            1
          </span>
          Question Configuration
        </h4>

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
              Answer length limit (words)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={content?.answer_length_limit || 3}
              onChange={(e) =>
                updateContent("answer_length_limit", Number(e.target.value))
              }
              placeholder="3"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
            />
            <p className="mt-1 text-xs text-slate-500">
              Maximum number of words students can type
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Text before answer (optional)
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
              Text after answer (optional)
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
      </div>

      {/* Correct Answers Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-main">
            2
          </span>
          {isGrouped ? (
            <>
              Correct Answers (Q{questionNumberStart}-Q{questionNumberEnd})
            </>
          ) : (
            <>Correct Answer</>
          )}
        </h4>

        {isGrouped ? (
          <div className="space-y-6">
            {questionRange.map((qNum) => {
              const statements = content?.statements || [];
              const statement = statements[qNum - questionNumberStart];

              return (
                <div
                  key={qNum}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Question {qNum}
                    </p>
                    {statement && (
                      <p className="text-sm text-slate-600 mt-1">{statement}</p>
                    )}
                  </div>
                  {renderAnswerFields(qNum)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {renderAnswerFields()}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          📚 IELTS Scoring Guide
        </p>
        <ul className="mt-2 space-y-1 text-xs text-blue-800">
          <li>
            • <strong>Primary Answer:</strong> The main correct answer (always
            required)
          </li>
          <li>
            • <strong>Alternatives:</strong> Other acceptable spellings or
            synonyms
          </li>
          <li>
            • <strong>Case Sensitive:</strong> Typically OFF for IELTS (accepts
            any case)
          </li>
          <li>
            • <strong>Example:</strong> Primary "bus stop" + Alternatives
            "bus-stop", "bus station"
          </li>
        </ul>
      </div>
    </div>
  );
}
