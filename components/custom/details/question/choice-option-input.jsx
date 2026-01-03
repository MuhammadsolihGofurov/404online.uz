"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";

const ChoiceComponent = ({ node, updateAttributes, deleteNode, editor }) => {
  const { options, question, isMulti, questionNumber } = node.attrs;

  const addOption = () => {
    const newOptions = [
      ...options,
      {
        label: `Option ${String.fromCharCode(65 + options.length)}`,
        isCorrect: false,
      },
    ];
    updateAttributes({ options: newOptions });
  };

  const toggleCorrect = (index) => {
    const newOptions = options.map((opt, i) => {
      if (isMulti)
        return i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt;
      return { ...opt, isCorrect: i === index };
    });
    updateAttributes({ options: newOptions });
  };

  const updateOptionLabel = (index, label) => {
    const newOptions = [...options];
    newOptions[index].label = label;
    updateAttributes({ options: newOptions });
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      updateAttributes({
        options: options.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <NodeViewWrapper className="choice-block-wrapper my-6">
      <div className="p-5 border-2 border-blue-100 rounded-xl bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
          <div className="flex items-center gap-2">
            {/* Question Number - contentEditable to allow typing */}
            <div contentEditable={false} className="inline-block">
              <input
                type="text"
                className="w-10 h-7 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-md text-center outline-none focus:ring-2 focus:ring-blue-400"
                value={questionNumber}
                onChange={(e) => {
                  e.preventDefault();
                  updateAttributes({ questionNumber: e.target.value });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Question Number"
              />
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                isMulti
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isMulti
                ? "Multiple Choice (Multiple)"
                : "Multiple Choice (Single)"}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              deleteNode();
            }}
            type="button"
            className="text-slate-300 hover:text-red-500"
            contentEditable={false}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex gap-3 items-start mb-4">
          <span
            className="font-bold text-slate-400 mt-1"
            contentEditable={false}
          >
            Q:
          </span>
          <div contentEditable={false} className="flex-1">
            <input
              className="w-full text-base font-bold outline-none border-b border-transparent focus:border-blue-400 p-1 bg-transparent"
              placeholder="Savol matni..."
              value={question}
              onChange={(e) => {
                e.preventDefault();
                updateAttributes({ question: e.target.value });
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="space-y-3 ml-7">
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-3 group">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCorrect(index);
                }}
                className={`transition-all ${
                  opt.isCorrect
                    ? "text-emerald-500"
                    : "text-slate-300 hover:text-slate-400"
                }`}
                contentEditable={false}
              >
                {opt.isCorrect ? (
                  <CheckCircle2
                    size={22}
                    fill="currentColor"
                    className="text-white fill-emerald-500"
                  />
                ) : (
                  <Circle size={22} />
                )}
              </button>
              <span
                className="font-bold text-slate-400 w-4 text-sm"
                contentEditable={false}
              >
                {String.fromCharCode(65 + index)}.
              </span>
              <div contentEditable={false} className="flex-1">
                <input
                  className={`w-full outline-none text-sm p-2 rounded-lg transition-colors ${
                    opt.isCorrect
                      ? "bg-emerald-50 font-semibold border border-emerald-200"
                      : "bg-slate-50 border border-transparent focus:bg-blue-50 focus:border-blue-200"
                  }`}
                  value={opt.label}
                  onChange={(e) => {
                    e.preventDefault();
                    updateOptionLabel(index, e.target.value);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeOption(index);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"
                contentEditable={false}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            addOption();
          }}
          className="mt-5 ml-7 flex items-center gap-2 text-[11px] font-black text-blue-600 border border-blue-600 border-dashed px-4 py-1.5 rounded-full hover:bg-blue-50"
          contentEditable={false}
        >
          <Plus size={14} /> ADD OPTION
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const ChoiceBlock = Node.create({
  name: "choiceBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      question: { default: "" },
      isMulti: { default: false },
      questionNumber: { default: "1" },
      options: {
        default: [
          { label: "Option A", isCorrect: false },
          { label: "Option B", isCorrect: false },
        ],
      },
    };
  },

  parseHTML() {
    return [{ tag: "choice-block" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["choice-block", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ChoiceComponent);
  },
});
