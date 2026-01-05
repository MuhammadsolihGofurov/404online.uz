"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";

const ReadOnlyBooleanQuestionComponent = ({ node, extension }) => {
  const questionNumber = node.attrs.number;
  const isTF = node.attrs.type === "tfng";

  const [value, setValue] = React.useState(
    extension.options.answers[questionNumber] || ""
  );

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = extension.options.answers[questionNumber] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [extension.options.answers[questionNumber]]); // Only depend on the specific question's answer

  const handleChange = (e) => {
    setValue(e.target.value);
    if (extension.options.onAnswerChange) {
      extension.options.onAnswerChange(questionNumber, e.target.value);
    }
  };

  const options = isTF
    ? ["TRUE", "FALSE", "NOT GIVEN"]
    : ["YES", "NO", "NOT GIVEN"];

  return (
    <NodeViewWrapper className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 mb-2">
      <span className="w-10 h-10 flex items-center justify-center font-bold text-slate-700 bg-slate-100 rounded-lg">
        {questionNumber}
      </span>
      <div className="flex-1 pt-2">
        <NodeViewContent className="text-slate-700 text-sm italic min-h-[24px]" />
      </div>
      <div className="flex flex-col items-end">
        <select
          value={value}
          onChange={handleChange}
          className="text-xs font-medium border border-slate-300 rounded px-2 py-1 h-7 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-700 uppercase"
          data-question-number={questionNumber}
        >
          <option value="">Select</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </NodeViewWrapper>
  );
};

export const ReadOnlyBooleanQuestion = Node.create({
  name: "booleanQuestion",
  group: "block",
  content: "inline*",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      number: { default: "1" },
      type: { default: "tfng" },
      answer: { default: "" },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="boolean-question"]' },
    { tag: "boolean-question" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "boolean-question" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyBooleanQuestionComponent),
});

export const ReadOnlyBooleanBlock = Node.create({
  name: "booleanBlock",
  group: "block",
  content: "booleanQuestion+",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      type: { default: "tfng" },
      title: { default: "" },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="boolean-block"]' },
    { tag: "boolean-block" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "boolean-block" }),
    0,
  ],
  addNodeView: () =>
    ReactNodeViewRenderer(({ node }) => {
      return (
        <NodeViewWrapper className="my-6 p-5 border-2 border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="flex flex-col gap-1 mb-4">
            <span
              className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                node.attrs.type === "tfng" ? "bg-emerald-500" : "bg-orange-500"
              }`}
            >
              {node.attrs.type === "tfng"
                ? "True / False / Not Given"
                : "Yes / No / Not Given"}
            </span>
            {node.attrs.title && (
              <span className="font-semibold text-slate-600">
                {node.attrs.title}
              </span>
            )}
          </div>

          <NodeViewContent className="space-y-2" />
        </NodeViewWrapper>
      );
    }),
});
