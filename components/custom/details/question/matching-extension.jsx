"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { Trash2, PlusCircle, X, ListChecks } from "lucide-react";

// --- Savol Qatori Komponenti ---
const MatchingQuestionComponent = ({ node, updateAttributes, deleteNode }) => {
  return (
    <NodeViewWrapper className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 group transition-all hover:border-amber-200">
      <input
        className="w-8 h-8 text-center font-bold text-slate-700 bg-slate-100 rounded-md outline-none text-xs focus:ring-2 focus:ring-amber-400"
        required
        value={node.attrs.number}
        onChange={(e) => updateAttributes({ number: e.target.value })}
        placeholder="№"
      />
      <div className="flex-1">
        <NodeViewContent className="outline-none text-slate-600 text-sm min-h-[24px]" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400">Answer:</span>
        <input
          required
          className="w-12 h-8 text-center border-2 border-emerald-100 rounded-md font-bold text-emerald-600 outline-none focus:border-emerald-500 bg-emerald-50/30"
          maxLength={5}
          value={node.attrs.answer}
          onChange={(e) => updateAttributes({ answer: e.target.value })}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            deleteNode();
          }}
          type="button"
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

// --- Asosiy Konteiner Komponenti ---
const MatchingBlockComponent = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}) => {
  const addQuestion = (e) => {
    e.preventDefault();

    // 1. Mavjud savollarning raqamlarini yig'ib chiqamiz
    let maxNumber = 0;
    node.content.forEach((child) => {
      const num = parseInt(child.attrs.number);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });

    // 2. Agar savollar bo'lsa max + 1, bo'lmasa 1-raqam
    const nextNumber = (maxNumber > 0 ? maxNumber + 1 : 1).toString();

    const pos = getPos();
    const insertPos = pos + node.nodeSize - 1;

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: "matchingQuestion",
        attrs: { number: nextNumber }, // Yangi hisoblangan raqamni beramiz
      })
      .run();
  };

  const getLabelColor = () => {
    switch (node.attrs.type) {
      case "matching-headings":
        return "bg-amber-500";
      case "matching-info":
        return "bg-purple-500";
      case "matching-features":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <NodeViewWrapper className="matching-container my-8 p-6 border-2 border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getLabelColor()}`}
          >
            {node.attrs.type.replace("-", " ")}
          </span>
          <input
            className="font-bold text-slate-800 outline-none border-b-2 border-transparent focus:border-main min-w-[250px] transition-colors"
            placeholder="Sarlavha (masalan: List of Headings)"
            value={node.attrs.title}
            required
            onChange={(e) => updateAttributes({ title: e.target.value })}
          />
        </div>
        <button
          onClick={deleteNode}
          type="button"
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks size={14} className="text-slate-400" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Options (A, B, C...)
          </p>
        </div>
        <textarea
          className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 min-h-[120px] shadow-sm"
          placeholder="A. First option&#10;B. Second option&#10;C. Third option..."
          value={node.attrs.options}
          onChange={(e) => updateAttributes({ options: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          Questions:
        </p>
        <NodeViewContent className="min-h-[20px] flex flex-col gap-2" />
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="mt-6 flex items-center gap-2 text-[11px] font-bold text-main bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all active:scale-95 border border-blue-100"
      >
        <PlusCircle size={16} /> Add question
      </button>
    </NodeViewWrapper>
  );
};

// --- Nodes Export ---
export const MatchingBlock = Node.create({
  name: "matchingBlock",
  group: "block",
  content: "matchingQuestion+",
  draggable: true,
  addAttributes() {
    return {
      title: { default: "" },
      options: { default: "" },
      type: { default: "matching-headings" },
    };
  },
  parseHTML: () => [{ tag: 'div[data-type="matching-block"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "matching-block" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(MatchingBlockComponent),
});

export const MatchingQuestion = Node.create({
  name: "matchingQuestion",
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      number: { default: "1" },
      answer: { default: "" },
    };
  },
  parseHTML: () => [{ tag: 'div[data-type="matching-question"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "matching-question" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(MatchingQuestionComponent),
});
