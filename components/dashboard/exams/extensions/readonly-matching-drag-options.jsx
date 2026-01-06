"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingDragOptionsComponent = ({ node, extension }) => {
  const { options = [] } = node.attrs;
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [usedOptions, setUsedOptions] = React.useState({});

  const answersRef = extension.options.answers;
  const answers = answersRef.current || {};

  // Track which options are used
  React.useEffect(() => {
    const used = {};
    Object.keys(answers).forEach((questionNum) => {
      const answer = answers[questionNum];
      if (answer) {
        used[answer] = questionNum;
      }
    });
    setUsedOptions(used);
  }, [answers]);

  const handleDragStart = (e, option) => {
    setDraggedItem(option);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", option);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <NodeViewWrapper className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs font-semibold text-slate-600 mb-2">
        Available Options:
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const isUsed = usedOptions[option];
          const isDragging = draggedItem === option;

          return (
            <div
              key={index}
              draggable={!isUsed}
              onDragStart={(e) => handleDragStart(e, option)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isUsed
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isDragging
                  ? "bg-blue-600 text-white cursor-grabbing opacity-50"
                  : "bg-white text-blue-700 border border-blue-300 cursor-grab hover:bg-blue-100"
              }`}
            >
              {option}
            </div>
          );
        })}
      </div>
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingDragOptions = Node.create({
  name: "matchingDragOptions",
  group: "block",
  atom: true,

  addOptions() {
    return {
      answers: {},
    };
  },

  addAttributes() {
    return {
      options: {
        default: [],
        parseHTML: (element) => {
          const optionsAttr = element.getAttribute("options");
          if (optionsAttr) {
            try {
              return JSON.parse(optionsAttr);
            } catch (e) {
              console.error("Failed to parse options:", e);
              return [];
            }
          }
          return [];
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "matching-drag-options" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["matching-drag-options", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyMatchingDragOptionsComponent);
  },
});
