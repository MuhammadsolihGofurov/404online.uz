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

  return (
    <NodeViewWrapper className="inline-block mx-1 align-middle">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="..."
        className="inline-block w-20 h-7 px-2 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
        data-question-number={number}
      />
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
