import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyQuestionInputComponent = ({ node, extension }) => {
  const { number, answer } = node.attrs;

  // Access refs to get latest values
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;

  const [value, setValue] = React.useState(
    () => answersRef.current[number] || ""
  );

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = answersRef.current[number] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [answersRef.current[number]]); // Only depend on the specific question's answer

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswerChangeRef.current(number, newValue);
  };

  const handleClick = () => {
    // Check if a word was selected from drag items
    if (window.lastSelectedOption) {
      const word = window.lastSelectedOption;
      setValue(word);
      onAnswerChangeRef.current(number, word);
      window.lastSelectedOption = null; // Clear after use
    }
  };

  const handleRemove = () => {
    setValue("");
    onAnswerChangeRef.current(number, "");
  };

  return (
    <NodeViewWrapper className="inline-block mx-1 align-middle">
      {value ? (
        <span className="inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-md font-bold text-sm bg-blue-600 text-white">
          {value}
          <button
            onClick={handleRemove}
            className="ml-2 text-white hover:text-red-200 font-bold"
            type="button"
          >
            ×
          </button>
        </span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          placeholder="..."
          className="inline-block w-20 h-7 px-2 text-sm border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all border-slate-300 cursor-pointer"
          data-question-number={number}
        />
      )}
    </NodeViewWrapper>
  );
};

export const ReadOnlyQuestionInput = Node.create({
  name: "questionInput",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },

  addAttributes() {
    return {
      answer: { default: "" },
      number: { default: "1" },
    };
  },

  parseHTML() {
    return [{ tag: "question-input" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["question-input", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyQuestionInputComponent);
  },
});
