"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingQuestionComponent = ({ node, extension }) => {
  const questionNumber = node.attrs.number;
  const correctAnswer = node.attrs.answer;

  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;
  const hideInputsRef = extension.options.hideInputs;

  const [value, setValue] = React.useState(
    answersRef.current?.[questionNumber] || ""
  );
  const [hideInputs, setHideInputs] = React.useState(
    hideInputsRef?.current || false
  );

  React.useEffect(() => {
    // Update hideInputs state when it changes
    setHideInputs(hideInputsRef?.current || false);
  }, [hideInputsRef?.current]);

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = answersRef.current?.[questionNumber] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [answersRef.current?.[questionNumber], questionNumber]);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onAnswerChangeRef?.current) {
      onAnswerChangeRef.current(questionNumber, e.target.value);
    }
  };

  return (
    <NodeViewWrapper
      className={`flex items-center gap-3 p-2 rounded-lg border mb-2 transition-all ${
        hideInputs && value
          ? "bg-blue-50 border-blue-400"
          : "bg-white border-slate-200"
      }`}
    >
      <span
        className={`w-8 h-8 flex items-center justify-center font-bold rounded-md text-xs ${
          hideInputs && value
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {questionNumber}
      </span>
      <div className="flex-1">
        <NodeViewContent className="text-slate-600 text-sm min-h-[24px]" />
      </div>
      <div className="flex items-center gap-2">
        {hideInputs ? (
          <div
            className={`min-w-[4rem] h-8 px-3 flex items-center justify-center rounded-md font-bold text-sm ${
              value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {value || "—"}
          </div>
        ) : (
          <input
            type="text"
            className="w-16 h-7 text-center border border-slate-300 rounded text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            maxLength={5}
            value={value}
            onChange={handleChange}
            placeholder="..."
            data-question-number={questionNumber}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

const ReadOnlyMatchingBlockComponent = ({ node }) => {
  const getLabelColor = () => {
    switch (node.attrs.type) {
      case "matching-headings":
        return "bg-amber-500";
      case "matching-info":
        return "bg-purple-500";
      case "matching-features":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <NodeViewWrapper className="my-8 p-6 border-2 border-slate-200 rounded-2xl bg-white">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
        <span
          className={`text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getLabelColor()}`}
        >
          {node.attrs.type.replace("-", " ")}
        </span>
        {node.attrs.title && (
          <span className="font-bold text-slate-800">{node.attrs.title}</span>
        )}
      </div>

      {node.attrs.options && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Options
          </p>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
            {node.attrs.options}
          </pre>
        </div>
      )}

      <div className="space-y-2">
        <NodeViewContent className="flex flex-col gap-2" />
      </div>
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingQuestion = Node.create({
  name: "matchingQuestion",
  group: "block",
  content: "inline*",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
      hideInputs: false,
    };
  },
  addAttributes() {
    return {
      number: { default: "1" },
      answer: { default: "" },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="matching-question"]' },
    { tag: "matching-question" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "matching-question" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyMatchingQuestionComponent),
});

export const ReadOnlyMatchingBlock = Node.create({
  name: "matchingBlock",
  group: "block",
  content: "matchingQuestion+",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      type: { default: "matching-headings" },
      title: { default: "" },
      options: { default: "" },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="matching-block"]' },
    { tag: "matching-block" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "matching-block" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyMatchingBlockComponent),
});
