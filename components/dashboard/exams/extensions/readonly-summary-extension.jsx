"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

export const ReadOnlySummaryBlock = Node.create({
  name: "summaryBlock",
  group: "block",
  content: "block+",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      title: { default: "Summary Completion" },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="summary-block"]' },
    { tag: "summary-block" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "summary-block" }),
    0,
  ],
  addNodeView: () =>
    ReactNodeViewRenderer(({ node }) => {
      return (
        <NodeViewWrapper className="my-8">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-t-xl">
            <h4 className="font-bold text-xs uppercase tracking-widest">
              {node.attrs.title}
            </h4>
          </div>

          <div className="p-6 bg-amber-50/30 border-2 border-t-0 border-slate-800">
            <div className="prose prose-sm max-w-none italic text-slate-700">
              <NodeViewContent />
            </div>
          </div>

          {/* Word Bank Container */}
          <div className="p-4 bg-slate-50 border-2 border-t border-slate-300 rounded-b-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Word Bank
            </div>
            <div className="flex flex-wrap gap-2 word-bank-container">
              {/* Drag items will appear here */}
            </div>
          </div>
        </NodeViewWrapper>
      );
    }),
});
