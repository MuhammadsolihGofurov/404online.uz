"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { Trash2, Type } from "lucide-react";

export const SummaryBlock = Node.create({
  name: "summaryBlock",
  group: "block",
  content: "block+", // Ichida paragraflar va boshqa elementlar bo'lishi mumkin
  draggable: true,

  addAttributes() {
    return {
      title: { default: "Summary Completion" },
    };
  },

  parseHTML: () => [{ tag: 'div[data-type="summary-block"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "summary-block" }),
    0,
  ],

  addNodeView: () =>
    ReactNodeViewRenderer(({ node, updateAttributes, deleteNode }) => {
      return (
        <NodeViewWrapper className="summary-wrapper my-8 relative group">
          {/* Header qismi */}
          <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2 rounded-t-xl border-x border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Type size={16} className="text-blue-400" />
              <input
                className="bg-transparent font-bold text-xs uppercase tracking-widest outline-none border-b border-transparent focus:border-blue-400 min-w-[200px]"
                value={node.attrs.title}
                onChange={(e) => updateAttributes({ title: e.target.value })}
              />
            </div>
            <button
              onClick={deleteNode}
              type="button"
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Kontent qismi */}
          <div className="p-6 bg-amber-50/30 border-2 border-slate-800 rounded-b-xl shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]">
            <div className="prose prose-sm max-w-none italic text-slate-700">
              <NodeViewContent />
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400 font-medium">
            💡 Tip: To create a blank space within the Summary section, simply click the "Gap Fill" (Plus) button located above the text editor.
          </div>
        </NodeViewWrapper>
      );
    }),
});
