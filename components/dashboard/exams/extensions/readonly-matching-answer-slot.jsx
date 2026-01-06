"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingAnswerSlotComponent = ({ node, extension }) => {
  const questionNumber = node.attrs.number;

  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;
  const hideInputsRef = extension.options.hideInputs;

  const [value, setValue] = React.useState(
    answersRef.current?.[questionNumber] || ""
  );
  const [hideInputs, setHideInputs] = React.useState(
    hideInputsRef?.current || false
  );
  const [forceUpdate, setForceUpdate] = React.useState(0);

  React.useEffect(() => {
    setHideInputs(hideInputsRef?.current || false);
  }, [hideInputsRef?.current]);

  React.useEffect(() => {
    const newValue = answersRef.current?.[questionNumber] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [answersRef.current?.[questionNumber], questionNumber, forceUpdate]);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onAnswerChangeRef?.current) {
      onAnswerChangeRef.current(questionNumber, e.target.value);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const option = e.dataTransfer.getData("text/plain");

    if (option && onAnswerChangeRef?.current) {
      // Clear this option from any other question
      const currentAnswers = answersRef.current || {};
      Object.keys(currentAnswers).forEach((qNum) => {
        if (currentAnswers[qNum] === option && qNum !== questionNumber) {
          onAnswerChangeRef.current(qNum, "");
        }
      });

      // Set the new answer
      onAnswerChangeRef.current(questionNumber, option);
      setValue(option);
      setForceUpdate((prev) => prev + 1);
    }
  };

  const handleRemoveAnswer = () => {
    if (onAnswerChangeRef?.current) {
      onAnswerChangeRef.current(questionNumber, "");
      setValue("");
      setForceUpdate((prev) => prev + 1);
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-center"
      onDragOver={hideInputs ? handleDragOver : undefined}
      onDrop={hideInputs ? handleDrop : undefined}
    >
      {hideInputs ? (
        <span
          className={`inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-md font-bold text-sm transition-all ${
            value
              ? "bg-blue-600 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300"
          }`}
        >
          {value ? (
            <>
              {value}
              <button
                onClick={handleRemoveAnswer}
                className="ml-2 text-white hover:text-red-200 font-bold"
                type="button"
              >
                ×
              </button>
            </>
          ) : (
            "—"
          )}
        </span>
      ) : (
        <input
          type="text"
          className="w-16 h-8 text-center border border-slate-300 rounded text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          maxLength={5}
          value={value}
          onChange={handleChange}
          placeholder="..."
          data-question-number={questionNumber}
        />
      )}
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingAnswerSlot = Node.create({
  name: "matchingAnswerSlot",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
      hideInputs: false,
    };
  },

  addAttributes() {
    return {
      number: {
        default: "1",
        parseHTML: (element) => element.getAttribute("number") || "1",
      },
    };
  },

  parseHTML() {
    return [{ tag: "matching-answer-slot" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["matching-answer-slot", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyMatchingAnswerSlotComponent);
  },
});
