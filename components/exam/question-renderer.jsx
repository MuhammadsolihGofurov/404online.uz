import React, { memo } from "react";
import { McqRenderer } from "./renderers/McqRenderer";
import { TfngRenderer } from "./renderers/TfngRenderer";
import { ShortAnswerRenderer } from "./renderers/ShortAnswerRenderer";
import { SummaryRenderer } from "./renderers/SummaryRenderer";
import { MatchingRenderer } from "./renderers/MatchingRenderer";
import { TableRenderer } from "./renderers/TableRenderer";
import { EssayRenderer } from "./renderers/EssayRenderer";

/**
 * Main Question Renderer Dispatcher
 * Delegates rendering to optimized sub-components based on question type.
 */
export const QuestionRenderer = memo(({ question, value, onChange, disabled = false }) => {
  const { question_type } = question;

  switch (question_type) {
    case "MCQ_SINGLE":
    case "MCQ_MULTIPLE":
      return <McqRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "TFNG":
      return <TfngRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "SHORT_ANSWER":
      return <ShortAnswerRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "SUMMARY_FILL_BLANKS":
      return <SummaryRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "MATCHING_TABLE_CLICK":
    case "MATCHING_DRAG_DROP":
      return <MatchingRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "TABLE_COMPLETION":
      return <TableRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    case "ESSAY":
    case "WRITING_TASK_1":
    case "WRITING_TASK_2":
      return <EssayRenderer question={question} value={value} onChange={onChange} disabled={disabled} />;
    default:
      return (
        <div className="p-4 font-mono text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
          Unsupported Question Type: {question_type}
        </div>
      );
  }
});

QuestionRenderer.displayName = "QuestionRenderer";
