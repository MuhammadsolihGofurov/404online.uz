/**
 * FlowchartBuilder Component
 * Handles FLOWCHART_COMPLETION question type
 */

import React, { useCallback } from "react";
import { createId } from "../utils/questionConfig";

export function FlowchartBuilder({
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const steps = content?.steps || [];
  const values = correctAnswer?.values || {};

  const updateStep = useCallback((id, key, value) => {
    onContentChange({
      ...content,
      steps: steps.map((step) =>
        step.id === id ? { ...step, [key]: value } : step
      ),
    });
  }, [content, steps, onContentChange]);

  const updateAnswer = useCallback((blankId, value) => {
    onAnswerChange({
      values: {
        ...values,
        [blankId]: value,
      },
    });
  }, [values, onAnswerChange]);

  const addStep = useCallback(() => {
    onContentChange({
      ...content,
      steps: [
        ...steps,
        { id: createId(), text: "", blank_id: "" },
      ],
    });
  }, [content, steps, onContentChange]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Allowed words hint
        </label>
        <input
          type="text"
          value={content?.allowed_words || ""}
          onChange={(e) =>
            onContentChange({
              ...content,
              allowed_words: e.target.value,
            })
          }
          placeholder="Write NO MORE THAN TWO WORDS"
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Steps</p>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
          >
            + Step
          </button>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="grid gap-3 p-4 bg-white border rounded-2xl border-slate-200 md:grid-cols-3"
            >
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Step {index + 1}
                </label>
                <textarea
                  rows={2}
                  value={step.text}
                  onChange={(e) => updateStep(step.id, "text", e.target.value)}
                  placeholder="Describe the step content"
                  className="w-full px-3 py-2 mt-1 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Blank ID
                </label>
                <input
                  type="text"
                  value={step.blank_id || ""}
                  onChange={(e) => updateStep(step.id, "blank_id", e.target.value)}
                  placeholder="A, B..."
                  className="w-full px-3 py-2 mt-1 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
                {step.blank_id && (
                  <input
                    type="text"
                    value={values[step.blank_id] || ""}
                    onChange={(e) => updateAnswer(step.blank_id, e.target.value)}
                    placeholder="Correct answer"
                    className="w-full px-3 py-2 mt-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

