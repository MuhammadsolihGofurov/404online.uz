/**
 * LivePreview Component
 * Shows student-facing preview of the question
 */

import React from "react";
import { Eye } from "lucide-react";

export function LivePreview({ state, section }) {
  const isGrouped = state.question_number_end > state.question_number_start;
  const statements = state.content?.statements || [];
  const needsStatements = ["TFNG", "MCQ_SINGLE"].includes(state.question_type);

  return (
    <div className="p-5 space-y-4 border rounded-3xl border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Eye size={16} />
        Student preview
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Section
        </p>
        <p className="text-lg font-semibold text-slate-800">
          Part {section?.part_number}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Question
        </p>
        <p className="text-base font-medium text-slate-800">
          Q{state.question_number_start}
          {state.question_number_end > state.question_number_start
            ? ` - ${state.question_number_end}`
            : ""}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Prompt
        </p>
        <div
          className="prose-sm prose max-w-none text-slate-700"
          dangerouslySetInnerHTML={{
            __html: state.prompt || "<p>No prompt yet.</p>",
          }}
        />
      </div>
      {isGrouped && needsStatements && statements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
            Sub-questions
          </p>
          <div className="space-y-2">
            {statements.map((stmt, idx) => {
              const qNum = state.question_number_start + idx;
              return (
                <div key={idx} className="p-2 bg-white border rounded-lg border-slate-200">
                  <p className="mb-1 text-xs font-semibold text-slate-600">
                    Q{qNum}
                  </p>
                  <div
                    className="prose-sm prose max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: stmt || "<span className='italic text-slate-400'>No statement</span>",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="p-4 text-xs bg-white border border-dashed rounded-2xl border-slate-200 text-slate-500">
        Preview is illustrative. Exact layout will adapt to student player.
      </div>
    </div>
  );
}

