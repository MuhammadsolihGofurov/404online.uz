"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { Trash2, PlusCircle, X } from "lucide-react";

const BooleanQuestionComponent = ({ node, updateAttributes, deleteNode }) => {
  const isTF = node.attrs.type === "tfng";

  return (
    <NodeViewWrapper className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 group mb-2 shadow-sm">
      <input
        className="w-10 h-10 text-center font-bold text-slate-700 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
        value={node.attrs.number}
        onChange={(e) => updateAttributes({ number: e.target.value })}
        placeholder="№"
      />
      <div className="flex-1 pt-2">
        <NodeViewContent className="outline-none text-slate-700 text-sm italic min-h-[24px]" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <select
          value={node.attrs.answer}
          onChange={(e) => updateAttributes({ answer: e.target.value })}
          className="text-[11px] font-bold border-2 border-indigo-100 rounded-md p-1 bg-indigo-50/50 outline-none focus:border-indigo-400 text-indigo-700 uppercase"
        >
          <option value="">Answer</option>
          {isTF ? (
            <>
              <option value="TRUE">TRUE</option>
              <option value="FALSE">FALSE</option>
              <option value="NOT GIVEN">NOT GIVEN</option>
            </>
          ) : (
            <>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
              <option value="NOT GIVEN">NOT GIVEN</option>
            </>
          )}
        </select>
        <button
          onClick={deleteNode}
          type="button"
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const BooleanBlock = Node.create({
  name: "booleanBlock",
  group: "block",
  content: "booleanQuestion+",
  draggable: true,
  addAttributes() {
    return {
      type: { default: "tfng" },
      title: {
        default:
          "Do the following statements agree with the information given in the Reading Passage?",
      },
    };
  },
  parseHTML: () => [{ tag: 'div[data-type="boolean-block"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "boolean-block" }),
    0,
  ],
  addNodeView: () =>
    ReactNodeViewRenderer(
      ({ node, updateAttributes, deleteNode, editor, getPos }) => {
        const addQuestion = () => {
          // 1. Ushbu blok ichidagi eng katta raqamni topamiz
          let maxNumber = 0;
          node.content.forEach((child) => {
            const num = parseInt(child.attrs.number);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          });

          // 2. Keyingi raqamni aniqlaymiz (agar bo'sh bo'lsa 1 dan boshlaydi)
          const nextNumber = (maxNumber > 0 ? maxNumber + 1 : 1).toString();

          const pos = getPos();
          const insertPos = pos + node.nodeSize - 1;

          editor
            .chain()
            .focus()
            .insertContentAt(insertPos, {
              type: "booleanQuestion",
              attrs: {
                number: nextNumber, // <--- Dinamik raqam
                type: node.attrs.type,
                answer: "", // Yangi savol bo'sh javob bilan
              },
            })
            .run();
        };

        return (
          <NodeViewWrapper className="my-6 p-5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-1">
                <span
                  className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                    node.attrs.type === "tfng"
                      ? "bg-emerald-500"
                      : "bg-orange-500"
                  }`}
                >
                  {node.attrs.type === "tfng"
                    ? "True / False / Not Given"
                    : "Yes / No / Not Given"}
                </span>
                <input
                  className="font-semibold text-slate-600 bg-transparent outline-none border-b border-transparent focus:border-slate-400 min-w-[400px]"
                  value={node.attrs.title}
                  onChange={(e) => updateAttributes({ title: e.target.value })}
                />
              </div>
              <button
                onClick={deleteNode}
                type="button"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-all shadow-sm"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <NodeViewContent className="space-y-1" />

            <button
              onClick={addQuestion}
              type="button"
              className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <PlusCircle size={16} /> Add question
            </button>
          </NodeViewWrapper>
        );
      }
    ),
});

export const BooleanQuestion = Node.create({
  name: "booleanQuestion",
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      number: { default: "1" },
      answer: { default: "" },
      type: { default: "tfng" },
    };
  },
  parseHTML: () => [{ tag: 'div[data-type="boolean-question"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "boolean-question" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(BooleanQuestionComponent),
});
