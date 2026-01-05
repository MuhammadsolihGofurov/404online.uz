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

  return (
    <NodeViewWrapper className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 mb-2">
      <span className="w-8 h-8 flex items-center justify-center font-bold text-slate-700 bg-slate-100 rounded-md text-xs">
        {questionNumber}
      </span>
      <div className="flex-1">
        <NodeViewContent className="text-slate-600 text-sm min-h-[24px]" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-16 h-7 text-center border border-slate-300 rounded text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          maxLength={5}
          value={value}
          onChange={handleChange}
          placeholder="..."
          data-question-number={questionNumber}
        />
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
