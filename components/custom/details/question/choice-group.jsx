"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { Trash2, Plus, Settings2 } from "lucide-react";

const ChoiceGroupComponent = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}) => {
  const addOption = (e) => {
    e.preventDefault();
    const pos = getPos();
    if (typeof pos !== "number") return;

    // Blokning oxirgi nuqtasini aniqlash (nodeSize - 1)
    const insertPos = pos + node.nodeSize - 1;

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: "choiceItem",
        attrs: { isCorrect: false },
      })
      .run();
  };

  return (
    <NodeViewWrapper className="choice-group-container my-8 p-6 border-2 border-slate-200 rounded-2xl bg-white relative shadow-sm hover:shadow-md transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <select
              className="text-[10px] font-bold uppercase bg-white text-blue-600 rounded px-2 py-1 outline-none border-none shadow-sm cursor-pointer"
              value={node.attrs.type}
              onChange={(e) => updateAttributes({ type: e.target.value })}
            >
              <option value="single">Single Choice</option>
              <option value="multiple">Multiple Choice</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400">№</span>
            <input
              className="w-8 bg-transparent text-center font-bold text-main outline-none text-xs"
              value={node.attrs.questionNumber}
              required
              onChange={(e) =>
                updateAttributes({ questionNumber: e.target.value })
              }
            />
          </div>
        </div>
        <button
          onClick={deleteNode}
          type="button"
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Savol sarlavhasi */}
      <input
        className="w-full mb-4 text-lg font-bold text-slate-800 placeholder:text-slate-300 border-none outline-none focus:placeholder:opacity-0 transition-all"
        placeholder="Savol matnini yozing..."
        value={node.attrs.title}
        required
        onChange={(e) => updateAttributes({ title: e.target.value })}
      />

      {/* Ichki variantlar (NodeViewContent) */}
      <div className="min-h-[20px]">
        <NodeViewContent />
      </div>

      {/* Yangi variant qo'shish */}
      <button
        type="button"
        onClick={addOption}
        className="mt-6 flex items-center gap-2 text-[11px] font-bold text-main bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all active:scale-95"
      >
        <Plus size={16} /> Add option
      </button>
    </NodeViewWrapper>
  );
};

export const ChoiceGroup = Node.create({
  name: "choiceGroup",
  group: "block",
  content: "choiceItem+",
  draggable: true,
  addAttributes() {
    return {
      questionNumber: {
        default: "1",
        parseHTML: (el) => el.getAttribute("data-number"),
        renderHTML: (attrs) => ({
          "data-number": attrs.questionNumber,
        }),
      },
      title: { default: "" },
      type: { default: "single" },
    };
  },
  addCommands() {
    return {
      insertChoiceGroup:
        () =>
        ({ editor, chain }) => {
          let lastNumber = 0;

          // 1. Hujjatdagi eng katta raqamni topish
          editor.state.doc.descendants((node) => {
            if (node.type.name === "choiceGroup") {
              const num = parseInt(node.attrs.questionNumber, 10);
              if (!isNaN(num) && num > lastNumber) {
                lastNumber = num;
              }
            }
          });

          const nextNumber = (lastNumber + 1).toString();

          // 2. Yangi blokni JSON formatida kiritish
          // Bu usul ProseMirror-ning ichki Node-lariga qaraganda xavfsizroq
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                questionNumber: nextNumber,
                title: "",
                type: "single",
              },
              content: [
                { type: "choiceItem", attrs: { isCorrect: false } },
                { type: "choiceItem", attrs: { isCorrect: false } },
              ],
            })
            .run();
        },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="choice-group"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "choice-group",
        "data-number": HTMLAttributes.questionNumber,
      }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ChoiceGroupComponent);
  },
});
