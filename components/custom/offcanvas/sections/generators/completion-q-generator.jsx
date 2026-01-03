"use client";

import React, { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Dropcursor from "@tiptap/extension-dropcursor";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
  Bold,
  Underline as UnderlineIcon,
  PlusCircle,
  Save,
  Undo,
  Redo,
  Table as TableIcon,
  Columns,
  Rows,
  Trash2,
  ChevronLast,
  ChevronFirst,
  Merge,
  Split,
  Image as ImageIcon,
  Highlighter,
  Minus,
  CheckSquare,
  Layers,
} from "lucide-react";

import { QuestionInput } from "@/components/custom/details/question/question-input";
import { ChoiceBlock } from "@/components/custom/details/question/choice-option-input";

export default function CompletionQGenerator({ initialData, onSave }) {
  const [, setUpdateTick] = useState(0);
  const forceUpdate = useCallback(() => setUpdateTick((tick) => tick + 1), []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Dropcursor.configure({ color: "#3b82f6", width: 2 }),
      HorizontalRule,
      TextAlign.configure({
        types: ["heading", "paragraph", "tableCell", "tableHeader"],
      }),
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow,
      TableHeader,
      TableCell,
      QuestionInput,
      ChoiceBlock,
      Placeholder.configure({ placeholder: "IELTS topshiriqlarini yozing..." }),
    ],
    content: initialData || "",
    onUpdate: () => forceUpdate(),
    onSelectionUpdate: () => forceUpdate(),
    immediatelyRender: false,
  });

  if (!editor) return null;

  // Get next question number
  const getNextQuestionNumber = () => {
    let max = 0;
    editor.state.doc.descendants((n) => {
      if (n.type.name === "questionInput") {
        max = Math.max(max, parseInt(n.attrs.number) || 0);
      }
      if (n.type.name === "choiceBlock") {
        max = Math.max(max, parseInt(n.attrs.questionNumber) || 0);
      }
    });
    return (max + 1).toString();
  };

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-xl overflow-hidden flex flex-col min-h-[700px]">
      <div className="p-3 border-b border-slate-100 bg-slate-50 sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-2">
          {/* History */}
          <div className="flex bg-white rounded border border-slate-200 p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo size={18} />
            </ToolbarButton>
          </div>

          {/* Format */}
          <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
            >
              <Bold size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
            >
              <UnderlineIcon size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive("highlight")}
            >
              <Highlighter size={18} />
            </ToolbarButton>
          </div>

          {/* IELTS Questions */}
          <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "choiceBlock",
                    attrs: {
                      isMulti: false,
                      questionNumber: getNextQuestionNumber(),
                    },
                  })
                  .run()
              }
              title="Single Choice"
            >
              <CheckSquare size={18} className="text-blue-600" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "choiceBlock",
                    attrs: {
                      isMulti: true,
                      questionNumber: getNextQuestionNumber(),
                    },
                  })
                  .run()
              }
              title="Multiple Choice"
            >
              <Layers size={18} className="text-purple-600" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "questionInput",
                    attrs: {
                      number: getNextQuestionNumber(),
                      answer: "",
                    },
                  })
                  .run();
              }}
              title="Gap Fill"
            >
              <PlusCircle size={18} className="text-emerald-600" />
            </ToolbarButton>
          </div>

          {/* Elements */}
          <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
            <ToolbarButton
              onClick={() => {
                const url = window.prompt("URL:");
                if (url) editor.chain().focus().setImage({ src: url }).run();
              }}
            >
              <ImageIcon size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon size={18} />
            </ToolbarButton>
          </div>

          <button
            onClick={() => onSave(editor.getJSON())}
            className="ml-auto flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md"
          >
            <Save size={18} /> SAVE
          </button>
        </div>

        {/* JADVAL FUNKSIYALARI (TIKLANGAN) */}
        {editor.isActive("table") && (
          <div className="flex flex-wrap items-center gap-1 mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add Col Left"
            >
              <ChevronFirst size={14} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Col Right"
            >
              <ChevronLast size={14} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Col"
            >
              <Columns size={14} className="text-red-500" />
            </ToolbarButton>
            <div className="w-px h-4 bg-blue-200 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add Row Above"
            >
              <Rows size={14} className="rotate-180" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row Below"
            >
              <Rows size={14} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
            >
              <Trash2 size={14} className="text-red-500" />
            </ToolbarButton>
            <div className="w-px h-4 bg-blue-200 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().mergeCells().run()}
              title="Merge"
            >
              <Merge size={14} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().splitCell().run()}
              title="Split"
            >
              <Split size={14} />
            </ToolbarButton>

            {/* BU YERDA JADVALNI O'CHIRISH TUGMASI QAYTARILDI */}
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="ml-auto p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              title="Delete Entire Table"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50/30 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto shadow-sm min-h-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          min-height: 600px;
          outline: none;
          padding: 40px;
          background: white;
          border-radius: 12px;
        }
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 2rem 0;
          border: 2px solid #e2e8f0;
        }
        .ProseMirror td,
        .ProseMirror th {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 12px;
          position: relative;
        }
        .ProseMirror th {
          background-color: #f8fafc;
          font-weight: bold;
        }
        .ProseMirror .selectedCell:after {
          background: rgba(186, 218, 255, 0.4);
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px dashed #cbd5e1;
          margin: 3rem 0;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({ children, onClick, active, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-all ${
        active ? "bg-slate-800 text-white" : "hover:bg-slate-100 text-slate-600"
      } ${disabled ? "opacity-20" : "active:scale-95"}`}
    >
      {children}
    </button>
  );
}
