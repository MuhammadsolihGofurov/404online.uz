"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { X } from "lucide-react";

const ChoiceItemComponent = ({
  node,
  updateAttributes,
  getPos,
  editor,
  deleteNode,
}) => {
  const isCorrect = node.attrs.isCorrect;

  const getLetter = () => {
    // 1. pos raqam ekanligini tekshiramiz
    const pos = getPos();
    if (typeof pos !== "number") return "";

    try {
      // 2. Pozitsiyani resolve qilamiz
      const $pos = editor.state.doc.resolve(pos);

      // 3. Node-ning o'z indexini (parent ichidagi tartibini) olamiz
      // Bu usul ancha xavfsiz va aniq
      const index = $pos.index($pos.depth);

      return String.fromCharCode(65 + index);
    } catch (e) {
      return "";
    }
  };

  const handleToggle = (e) => {
    e.preventDefault();
    const pos = getPos();
    if (typeof pos !== "number") return;

    const $pos = editor.state.doc.resolve(pos);
    const parent = $pos.parent;
    const isSingleChoice = parent.attrs.type === "single";

    if (isSingleChoice) {
      const parentPos = pos - $pos.parentOffset;

      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            parent.forEach((child, offset) => {
              if (child.type.name === "choiceItem") {
                tr.setNodeMarkup(parentPos + offset, undefined, {
                  ...child.attrs,
                  isCorrect: false,
                });
              }
            });

            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              isCorrect: true,
            });
          }
          return true;
        })
        .run();
    } else {
      // Multiple bo'lsa, faqat o'zini toggle qilamiz
      updateAttributes({ isCorrect: !node.attrs.isCorrect });
    }
  };

  return (
    <NodeViewWrapper className="choice-item-wrapper flex items-center gap-3 group/item my-2">
      {/* Harf (A, B, C...) bosilganda tanlanadi */}
      <button
        type="button"
        onClick={handleToggle}
        className={`choice-item-label flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-all border-2 ${
          isCorrect
            ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {/* BU YERDA HARF KO'RINADI */}
        {getLetter()}
      </button>

      {/* Matn yozish qismi */}
      <NodeViewContent
        className={`flex-1 outline-none py-1 text-slate-700 min-h-[24px] border-b border-transparent focus:border-blue-200 transition-colors ${
          isCorrect ? "font-semibold text-emerald-700" : ""
        }`}
      />

      {/* O'chirish tugmasi */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          deleteNode();
        }}
        className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded"
      >
        <X size={14} />
      </button>
    </NodeViewWrapper>
  );
};

export const ChoiceItem = Node.create({
  name: "choiceItem",
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      isCorrect: {
        default: false,
        // Bazadan kelganda stringni boolean qilib olish uchun:
        parseHTML: (element) => element.getAttribute("isCorrect") === "true",
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="choice-item"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "choice-item" }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ChoiceItemComponent);
  },
});
