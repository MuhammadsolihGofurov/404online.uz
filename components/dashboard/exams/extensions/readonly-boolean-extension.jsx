"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";

const ReadOnlyBooleanRowComponent = ({ node, extension }) => {
  const { number, type, text } = node.attrs;
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;

  const [value, setValue] = React.useState(
    () => answersRef.current?.[number] || ""
  );

  React.useEffect(() => {
    const latest = answersRef.current?.[number] || "";
    if (latest !== value) {
      setValue(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersRef.current?.[number]]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswerChangeRef?.current?.(number, newValue);
  };

  const isTF = (type || "tfng").toLowerCase() === "tfng";
  const options = isTF
    ? ["TRUE", "FALSE", "NOT GIVEN"]
    : ["YES", "NO", "NOT GIVEN"];

  return (
    <NodeViewWrapper className="boolean-question-row flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <span className="q-num w-10 h-10 flex items-center justify-center font-semibold text-slate-700 bg-slate-100 rounded-lg text-base flex-shrink-0">
        {number}
      </span>
      <span className="q-text flex-1 text-slate-800 text-base leading-6 px-2">
        {text}
      </span>
      <select
        value={value}
        onChange={handleChange}
        className="text-sm font-medium border border-slate-300 rounded-md px-3 h-10 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-700 flex-shrink-0"
        data-question-number={number}
      >
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </NodeViewWrapper>
  );
};

const ReadOnlyBooleanQuestionComponent = ({ node, extension }) => {
  const { number, type } = node.attrs;
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;

  const [value, setValue] = React.useState(
    () => answersRef.current?.[number] || ""
  );

  React.useEffect(() => {
    const latest = answersRef.current?.[number] || "";
    if (latest !== value) {
      setValue(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersRef.current?.[number]]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswerChangeRef?.current?.(number, newValue);
  };

  const isTF = (type || "tfng").toLowerCase() === "tfng";
  const options = isTF
    ? ["TRUE", "FALSE", "NOT GIVEN"]
    : ["YES", "NO", "NOT GIVEN"];

  return (
    <NodeViewWrapper className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <span className="w-10 h-10 flex items-center justify-center font-semibold text-slate-700 bg-slate-100 rounded-lg text-base">
        {number}
      </span>
      <div className="flex-1">
        <NodeViewContent className="text-slate-800 text-base leading-6" />
      </div>
      <div className="flex items-center">
        <select
          value={value}
          onChange={handleChange}
          className="text-sm font-medium border border-slate-300 rounded-md px-3 h-10 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-700"
          data-question-number={number}
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
    {
      tag: "boolean-answer-slot",
      getAttrs: (el) => ({
        number: el.getAttribute("number"),
        type: el.getAttribute("type"),
      }),
    },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "boolean-answer-slot",
    mergeAttributes(HTMLAttributes),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyBooleanQuestionComponent),
});

export const ReadOnlyBooleanRow = Node.create({
  name: "booleanRow",
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
      number: {
        default: "1",
        parseHTML: (el) => {
          const numEl = el.querySelector?.(".q-num");
          return numEl?.textContent?.trim() || "1";
        },
      },
      type: {
        default: "tfng",
        parseHTML: (el) => {
          const slotEl = el.querySelector?.("boolean-answer-slot");
          return slotEl?.getAttribute("type") || "tfng";
        },
      },
      text: {
        default: "",
        parseHTML: (el) => {
          const textSpan = el.querySelector?.(".q-text");
          return textSpan?.textContent?.trim() || "";
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div.boolean-question-row",
        getAttrs: (el) => {
          const slotEl = el.querySelector("boolean-answer-slot");
          const textEl = el.querySelector(".q-text");
          return {
            number: el.querySelector(".q-num")?.textContent?.trim() || "1",
            type: slotEl?.getAttribute("type") || "tfng",
            text: textEl?.textContent?.trim() || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "boolean-question-row" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyBooleanRowComponent);
  },
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
