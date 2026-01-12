import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
} from "@tiptap/react";
import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";

// 1. NodeView Komponenti (Buni Node definition'dan oldin yozish xavfsizroq)
const DragDropComponent = ({ node, updateAttributes }) => {
  const [newWord, setNewWord] = useState("");
  const { title } = node.attrs;

  let options = [];
  try {
    options =
      typeof node.attrs.options === "string"
        ? JSON.parse(node.attrs.options)
        : Array.isArray(node.attrs.options)
        ? node.attrs.options
        : [];
  } catch (e) {
    options = [];
  }

  const addWord = () => {
    if (newWord.trim()) {
      updateAttributes({ options: [...options, newWord.trim()] });
      setNewWord("");
    }
  };

  const removeWord = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    updateAttributes({ options: newOptions });
  };

  return (
    <NodeViewWrapper className="drag-drop-summary-node">
      <div className="my-6 border-2 border-indigo-200 rounded-xl overflow-hidden bg-white shadow-md">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-2">
          <input
            value={title}
            required
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="bg-transparent border-none outline-none font-bold w-full text-white placeholder:text-indigo-300"
            placeholder="Enter Summary Title..."
          />
        </div>

        {/* Content Area - Matn shu yerga yoziladi */}
        <div className="p-6 bg-slate-50 min-h-[100px] prose prose-slate max-w-none">
          <NodeViewContent />
        </div>

        {/* Word Bank Editor */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">
            Word Bank / Options
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {options && options.length > 0 ? (
              options.map((word, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md text-sm text-indigo-700 group"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => removeWord(idx)}
                    className="hover:bg-red-100 p-0.5 rounded text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-slate-400 text-xs">
                No options added yet
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addWord())
              }
              placeholder="Add word to bank..."
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 flex-1 bg-slate-50"
            />
            <button
              type="button"
              onClick={addWord}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// 2. Extension Definition
export const DragDropSummaryBlock = Node.create({
  name: "dragDropSummary",
  group: "block",
  content: "block+", // Ichida paragraph va boshqa blocklar bo'lishi uchun
  defining: true,

  addAttributes() {
    return {
      title: { default: "Summary Completion" },
      options: {
        default: [],
        // HTML dan o'qiyotganda stringni massivga aylantiradi
        parseHTML: (element) => {
          const data = element.getAttribute("options");
          try {
            return data ? JSON.parse(data) : [];
          } catch (e) {
            return [];
          }
        },
        // HTML ga yozayotganda massivni stringga aylantiradi
        renderHTML: (attributes) => {
          return {
            options: JSON.stringify(attributes.options),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="dragDropSummary"]' },
      { tag: 'div[data-type="drag-drop-summary"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "drag-drop-summary" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DragDropComponent);
  },
});
