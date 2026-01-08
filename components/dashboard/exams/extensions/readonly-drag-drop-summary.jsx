"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

export const ReadOnlyDragDropSummary = Node.create({
  name: "dragDropSummary",
  group: "block",
  content: "block+",
  draggable: false,
  priority: 1000, // High priority to parse before dragItem

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },

  addAttributes() {
    return {
      title: { default: "Summary Completion" },
      options: { default: [] },
      isDragDrop: { default: true },
      words: { default: [] },
    };
  },

  parseHTML: () => [
    {
      tag: 'div[data-type="dragDropSummary"]',
      getAttrs: (element) => {
        const title = element.getAttribute("title") || "Summary Completion";
        const optionsStr = element.getAttribute("options") || "[]";
        const wordsStr = element.getAttribute("words") || "[]";

        let options = [];
        try {
          options = JSON.parse(optionsStr);
        } catch (e) {
          options = [];
        }

        let words = [];
        try {
          words = JSON.parse(wordsStr);
        } catch (e) {
          words = [];
        }

        return {
          title,
          options: options.length > 0 ? options : words,
          words,
          isDragDrop: true,
        };
      },
    },
  ],

  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "dragDropSummary" }),
    0,
  ],

  addNodeView: () =>
    ReactNodeViewRenderer(({ node, extension }) => {
      const { title, options } = node.attrs;
      const answersRef = extension.options.answers;

      return (
        <NodeViewWrapper className="my-8">
          {/* Header */}
          <div className="bg-slate-800 text-white px-4 py-2 rounded-t-xl">
            <h4 className="font-bold text-xs uppercase tracking-widest">
              {title}
            </h4>
          </div>

          {/* Content with question-inputs */}
          <div className="p-6 bg-amber-50/30 border-2 border-t-0 border-slate-800">
            <div className="prose prose-sm max-w-none italic text-slate-700">
              <NodeViewContent />
            </div>
          </div>

          {/* Word Bank Container */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-t border-slate-300 rounded-b-xl">
            <div className="text-xs font-black text-slate-600 uppercase mb-3 tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              Available Words
            </div>
            <div className="flex flex-wrap gap-3">
              {options && options.length > 0 ? (
                options.map((word, idx) => {
                  // Check if word is used
                  const answers = answersRef?.current || {};
                  const isUsed = Object.values(answers).includes(word);

                  return (
                    <button
                      key={idx}
                      type="button"
                      draggable={!isUsed}
                      disabled={isUsed}
                      onDragStart={(e) => {
                        if (isUsed) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData("text/plain", word);
                      }}
                      onClick={() => {
                        if (!isUsed) {
                          window.lastSelectedOption = word;
                        }
                      }}
                      className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all select-none border-2 shadow-sm ${
                        isUsed
                          ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                          : "bg-white text-blue-700 border-blue-300 cursor-grab hover:bg-blue-100 hover:border-blue-400 hover:shadow-md active:cursor-grabbing active:scale-95"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })
              ) : (
                <span className="text-slate-400 text-xs italic">
                  No words available
                </span>
              )}
            </div>
          </div>
        </NodeViewWrapper>
      );
    }),
});
