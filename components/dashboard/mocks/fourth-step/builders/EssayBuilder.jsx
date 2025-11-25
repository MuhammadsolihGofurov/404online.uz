/**
 * EssayBuilder Component
 * Handles ESSAY question type
 */

import React from "react";
import dynamic from "next/dynamic";
import { getEssayDefaultMinWordCount } from "../utils/questionUtils";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
  ),
});

export function EssayBuilder({
  content,
  correctAnswer,
  section,
  onContentChange,
  onAnswerChange,
}) {
  const minWord = content?.min_word_count ?? getEssayDefaultMinWordCount(section);
  const modelAnswer = correctAnswer?.text || "";

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Minimum word count
        </label>
        <input
          type="number"
          min={50}
          value={minWord}
          onChange={(e) =>
            onContentChange({
              ...content,
              min_word_count: Number(e.target.value) || 0,
            })
          }
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
        <p className="mt-2 text-xs text-slate-500">
          Students must meet this requirement before submission.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Model answer (optional)
        </label>
        <ReactQuill
          theme="snow"
          value={modelAnswer}
          onChange={(value) =>
            onAnswerChange({ ...(correctAnswer || {}), text: value })
          }
          placeholder="Provide a reference response or scoring notes."
        />
        <p className="text-xs text-slate-500">
          Visible to reviewers only; students cannot see the model answer.
        </p>
      </div>
    </div>
  );
}

