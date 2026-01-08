import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyQuestionInputComponent = ({ node, extension }) => {
  const { number, answer } = node.attrs;

  // Access refs to get latest values
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;

  const [value, setValue] = React.useState(
    () => answersRef.current?.[number] || ""
  );

  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = answersRef.current?.[number] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersRef.current?.[number]]); // Only depend on the specific question's answer

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswerChangeRef?.current?.(number, newValue);
    // Notify listeners (e.g., drag items) that answers changed
    window.dispatchEvent(
      new CustomEvent("tiptap-answers-updated", {
        detail: { number, value: newValue },
      })
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const word = e.dataTransfer.getData("text/plain");
    if (word) {
      setValue(word);
      onAnswerChangeRef?.current?.(number, word);
      // Broadcast answer update so chips can react immediately
      window.dispatchEvent(
        new CustomEvent("tiptap-answers-updated", {
          detail: { number, value: word },
        })
      );
    }
  };

  return (
    <NodeViewWrapper className="inline-block mx-1 align-middle">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        placeholder={String(number)}
        style={{
          display: "inline-block",
          width: "96px",
          height: "32px",
          padding: "0 8px",
          fontSize: "14px",
          borderWidth: "2px",
          borderRadius: "4px",
          borderColor: isDragOver ? "#60a5fa" : "#93c5fd",
          backgroundColor: isDragOver ? "#eff6ff" : "#ffffff",
          outline: "none",
          fontWeight: "500",
          transition: "all 0.2s",
          cursor: "text",
        }}
        className={`inline-block w-24 h-8 px-2 text-sm border-2 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all font-medium ${
          isDragOver ? "border-blue-400 bg-blue-50" : "border-blue-300 bg-white"
        }`}
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
      number: {
        default: "1",
        parseHTML: (el) => el.getAttribute("number") || "1",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "question-input",
        getAttrs: (el) => ({
          number: el.getAttribute("number") || "1",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["question-input", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyQuestionInputComponent);
  },
});
