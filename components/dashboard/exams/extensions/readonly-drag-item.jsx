import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyDragItemComponent = ({ node, extension }) => {
  const { word } = node.attrs;
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;

  // Check if this option is used
  const isUsed = React.useMemo(() => {
    const answers = answersRef?.current || {};
    return Object.values(answers).includes(word);
  }, [answersRef?.current, word]);

  const handleClick = () => {
    // Don't allow selecting if already used
    if (isUsed) return;

    // Store this word temporarily so question-input can pick it up
    window.lastSelectedOption = word;
  };

  return (
    <NodeViewWrapper as="span" className="inline-block mx-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUsed}
        className={`inline-block px-3 py-2 rounded-md font-bold text-sm transition-all select-none border-2 ${
          isUsed
            ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
            : "bg-white text-blue-700 border-blue-300 cursor-pointer hover:bg-blue-50 hover:border-blue-500"
        }`}
      >
        {word}
      </button>
    </NodeViewWrapper>
  );
};

export const ReadOnlyDragItem = Node.create({
  name: "dragItem",
  group: "block",
  inline: false,
  atom: true,

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },

  addAttributes() {
    return {
      word: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class~=drag-item]",
        getAttrs: (element) => ({
          word: element.getAttribute("data-word") || element.textContent,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ class: "drag-item" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyDragItemComponent);
  },
});
