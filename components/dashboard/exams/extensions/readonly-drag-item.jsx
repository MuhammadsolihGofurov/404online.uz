import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyDragItemComponent = ({ node, extension }) => {
  const { word } = node.attrs;
  const answersRef = extension.options.answers;
  const [version, bump] = React.useState(0);

  // Recompute on version bumps to reflect mutable answersRef.current
  const isUsed = React.useMemo(() => {
    const answers = answersRef?.current || {};
    return Object.values(answers).includes(word);
  }, [answersRef, word, version]);

  // Poll for answer changes to update UI quickly
  React.useEffect(() => {
    const handleAnswersUpdated = () => bump((v) => v + 1);
    window.addEventListener("tiptap-answers-updated", handleAnswersUpdated);

    const checkInterval = setInterval(() => {
      const answers = answersRef?.current || {};
      const nowUsed = Object.values(answers).includes(word);
      if (nowUsed !== isUsed) {
        bump((v) => v + 1);
      }
    }, 50);

    return () => {
      window.removeEventListener(
        "tiptap-answers-updated",
        handleAnswersUpdated
      );
      clearInterval(checkInterval);
    };
  }, [answersRef, word, isUsed]);

  const handleClick = () => {
    if (!isUsed) {
      window.lastSelectedOption = word;
    }
  };

  const handleDragStart = (e) => {
    if (isUsed) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", word);
  };

  return (
    <NodeViewWrapper as="span" className="drag-item-wrapper inline-block">
      <button
        type="button"
        draggable={!isUsed}
        onClick={handleClick}
        onDragStart={handleDragStart}
        disabled={isUsed}
        className={`px-3 py-2 rounded-md font-semibold text-sm transition-all select-none border-2 ${
          isUsed
            ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
            : "bg-white text-blue-600 border-blue-400 cursor-grab hover:bg-blue-50 hover:border-blue-500 hover:shadow-sm active:cursor-grabbing active:scale-[0.98]"
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
  priority: 50, // Lower priority than dragDropSummary

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
        // Don't parse if inside a dragDropSummary container
        priority: 50,
        getAttrs: (element) => {
          // Skip if parent has data-type="dragDropSummary"
          if (element.closest('[data-type="dragDropSummary"]')) {
            return false;
          }
          return {
            word: element.getAttribute("data-word") || element.textContent,
          };
        },
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
