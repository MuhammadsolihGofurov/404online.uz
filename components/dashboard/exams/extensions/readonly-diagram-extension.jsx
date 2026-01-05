"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

// Individual input component with state
const DiagramInput = ({
  questionNumber,
  answers,
  onAnswerChange,
  ...props
}) => {
  const [value, setValue] = React.useState(answers[questionNumber] || "");

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = answers[questionNumber] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [answers[questionNumber]]); // Only depend on the specific question's answer

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onAnswerChange) {
      onAnswerChange(questionNumber, e.target.value);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      data-question-number={questionNumber}
      {...props}
    />
  );
};

const ReadOnlyDiagramComponent = ({ node, extension }) => {
  const { src, labels = [] } = node.attrs;

  return (
    <NodeViewWrapper className="my-8 p-5 bg-white border-2 border-slate-200 rounded-2xl">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          Diagram / Map Labeling
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Label the diagram by entering your answers in the boxes
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 min-h-[200px]">
        {src ? (
          <div className="relative inline-block w-full">
            <img
              src={src}
              alt="Diagram"
              className="w-full h-auto block select-none"
              draggable={false}
            />

            {labels.map((label, index) => (
              <div
                key={index}
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white">
                    {label.number}
                  </div>
                  <DiagramInput
                    questionNumber={label.number}
                    answers={extension.options.answers}
                    onAnswerChange={extension.options.onAnswerChange}
                    className="w-20 h-7 text-center text-xs border border-slate-300 rounded bg-white shadow-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    placeholder="..."
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-400 italic">No diagram image</p>
          </div>
        )}
      </div>

      {labels?.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {labels?.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
            >
              <span className="font-bold text-slate-700 text-sm">
                {l?.number}.
              </span>
              <DiagramInput
                questionNumber={l?.number}
                answers={extension.options.answers}
                onAnswerChange={extension.options.onAnswerChange}
                className="flex-1 h-7 px-2 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                placeholder="Your answer"
              />
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const ReadOnlyDiagramBlock = Node.create({
  name: "diagramBlock",
  group: "block",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      src: { default: "" },
      labels: { default: [] },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="diagram-block"]' },
    { tag: "diagram-block" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "diagram-block" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyDiagramComponent),
});
