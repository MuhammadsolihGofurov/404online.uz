/**
 * QuestionEditor - Main Component
 * Clean, modular question editor using extracted hooks and components
 */

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Save, Loader2, Sparkles } from "lucide-react";
import { QUESTION_TYPE_CONFIG } from "./utils/questionConfig";
import { getSectionMockType } from "./utils/questionUtils";
import { useQuestionForm } from "./hooks/useQuestionForm";
import {
  McqBuilder,
  MatchingBuilder,
  ShortAnswerBuilder,
  TableBuilder,
} from "../questions";
import { SummaryBuilder } from "./builders/SummaryBuilder";
import { TfngBuilder } from "./builders/TfngBuilder";
import { MapBuilder } from "./builders/MapBuilder";
import { FlowchartBuilder } from "./builders/FlowchartBuilder";
import { EssayBuilder } from "./builders/EssayBuilder";
import { LivePreview } from "./components/LivePreview";
import { WarningBanner } from "./components/WarningBanner";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
  ),
});

export default function QuestionEditor({
  isOpen,
  section,
  question,
  onClose,
  onSuccess,
}) {
  const {
    state,
    isSubmitting,
    updateContent,
    updateAnswer,
    updatePrompt,
    updateQuestionRange,
    handleTypeChange,
    handleSubmit,
    patchState,
  } = useQuestionForm(section, question);

  const mockType = getSectionMockType(section);
  const isWritingMock = mockType === "WRITING";
  const isWritingMode = isWritingMock || state.question_type === "ESSAY";

  const typeOptions = useMemo(
    () =>
      Object.entries(QUESTION_TYPE_CONFIG).map(([value, meta]) => ({
        value,
        label: meta.label,
        helper: meta.helper,
      })),
    []
  );

  const selectedTypeMeta = QUESTION_TYPE_CONFIG[state.question_type];

  const renderBuilder = () => {
    const commonProps = {
      content: state.content,
      correctAnswer: state.correct_answer,
      onContentChange: updateContent,
      onAnswerChange: updateAnswer,
    };

    const rangeProps = {
      questionNumberStart: state.question_number_start,
      questionNumberEnd: state.question_number_end,
    };

    switch (state.question_type) {
      case "MCQ_SINGLE":
      case "MCQ_MULTIPLE":
        return (
          <McqBuilder
            questionType={state.question_type}
            {...commonProps}
            {...rangeProps}
          />
        );
      case "MATCHING_DRAG_DROP":
        return <MatchingBuilder {...commonProps} />;
      case "MATCHING_TABLE_CLICK":
        return (
          <TableBuilder
            mode="matching"
            {...commonProps}
          />
        );
      case "SHORT_ANSWER":
        return (
          <ShortAnswerBuilder
            {...commonProps}
            {...rangeProps}
          />
        );
      case "TABLE_COMPLETION":
        return (
          <TableBuilder
            mode="completion"
            {...commonProps}
          />
        );
      case "TFNG":
        return (
          <TfngBuilder
            {...commonProps}
            {...rangeProps}
          />
        );
      case "SUMMARY_FILL_BLANKS":
      case "SUMMARY_DRAG_DROP":
        return (
          <SummaryBuilder
            questionType={state.question_type}
            {...commonProps}
            {...rangeProps}
          />
        );
      case "MAP_LABELLING":
        return <MapBuilder {...commonProps} />;
      case "FLOWCHART_COMPLETION":
        return <FlowchartBuilder {...commonProps} />;
      case "ESSAY":
        return (
          <EssayBuilder
            {...commonProps}
            section={section}
          />
        );
      default:
        return (
          <div className="p-6 text-sm border border-dashed rounded-2xl border-slate-300 text-slate-500">
            Builder for {state.question_type} is coming soon.
          </div>
        );
    }
  };

  const blockingMessage = !section ? "Select a section first." : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex flex-col w-full h-full ml-auto overflow-y-auto bg-white shadow-2xl max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Question editor
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              {question ? "Edit question" : "Create new question"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {blockingMessage ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-10 text-center">
            <WarningBanner message={blockingMessage} />
          </div>
        ) : (
          <div className="grid flex-1 gap-6 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr]">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Question Type Selector */}
              {!isWritingMode && (
                <div className="p-4 space-y-4 border rounded-3xl border-slate-200 bg-slate-50">
                  <label className="text-sm font-semibold text-slate-600">
                    Question type
                  </label>
                  <select
                    value={state.question_type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-semibold bg-white border rounded-2xl border-slate-200 text-slate-700 focus:border-main focus:ring-4 focus:ring-main/10"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedTypeMeta && (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles size={14} className="text-main" />
                      {selectedTypeMeta.helper}
                    </p>
                  )}
                </div>
              )}

              {/* Question Range */}
              {isWritingMode ? (
                <div className="p-4 space-y-3 border rounded-3xl border-slate-200 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">
                    Essay question numbers
                  </p>
                  <p className="text-xs text-slate-500">
                    Writing tasks use a single prompt. Question numbers are automatically managed.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Question number
                      </label>
                      <input
                        type="number"
                        value={state.question_number_start}
                        readOnly
                        className="w-full px-4 py-3 mt-1 text-sm bg-white border rounded-2xl border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Ends at
                      </label>
                      <input
                        type="number"
                        value={state.question_number_start}
                        readOnly
                        className="w-full px-4 py-3 mt-1 text-sm bg-white border rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Question starts at
                    </label>
                    <select
                      value={state.question_number_start}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        const end = Math.max(start, state.question_number_end);
                        updateQuestionRange(start, end);
                      }}
                      className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
                    >
                      {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Ends at
                    </label>
                    <select
                      value={state.question_number_end}
                      onChange={(e) =>
                        updateQuestionRange(
                          state.question_number_start,
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
                    >
                      {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                        <option
                          key={num}
                          value={num}
                          disabled={num < state.question_number_start}
                        >
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Prompt (Rich text)
                </label>
                <ReactQuill
                  theme="snow"
                  value={state.prompt}
                  onChange={updatePrompt}
                />
              </div>

              {/* Builder Section */}
              <div className="p-5 space-y-5 bg-white border rounded-3xl border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-900">
                    Type specific content
                  </h4>
                </div>
                {renderBuilder()}
              </div>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="flex flex-col gap-6">
              <LivePreview state={state} section={section} />
              <div className="p-5 space-y-4 bg-white border rounded-3xl border-slate-200">
                <h4 className="text-base font-semibold text-slate-900">
                  Finalize
                </h4>
                <p className="text-sm text-slate-500">
                  Map the question to questions {state.question_number_start} –{" "}
                  {state.question_number_end} within Part {section?.part_number}.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-sm font-semibold border rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(onSuccess, onClose)}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center flex-1 gap-2 px-4 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-main shadow-main/30 hover:bg-main/90 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save question
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

