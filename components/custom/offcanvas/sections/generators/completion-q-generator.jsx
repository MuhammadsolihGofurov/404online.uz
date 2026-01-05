"use client";

import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
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
  ListTodo,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Type,
  MapPin,
  List,
  ListOrdered,
} from "lucide-react";

import { QuestionInput } from "@/components/custom/details/question/question-input";
import { ChoiceGroup } from "@/components/custom/details/question/choice-group";
import { ChoiceItem } from "@/components/custom/details/question/choice-item";
import { transformEditorData } from "@/utils/question-helpers";
import {
  MatchingBlock,
  MatchingQuestion,
} from "@/components/custom/details/question/matching-extension";
import {
  BooleanBlock,
  BooleanQuestion,
} from "@/components/custom/details/question/boolean-extension";
import { SummaryBlock } from "@/components/custom/details/question/summary-extension";
import { DiagramBlock } from "@/components/custom/details/question/diagram-extension";

const CompletionQGenerator = forwardRef(
  ({ initialData, diagramImage }, ref) => {
    const [, setUpdateTick] = useState(0);
    const forceUpdate = useCallback(
      () => setUpdateTick((tick) => tick + 1),
      []
    );

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
        Placeholder.configure({
          placeholder: "Write IELTS tasks...",
        }),
        ChoiceGroup,
        ChoiceItem,
        MatchingBlock,
        MatchingQuestion,
        BooleanBlock,
        BooleanQuestion,
        SummaryBlock,
        DiagramBlock,
      ],
      content: initialData || "",
      onUpdate: () => forceUpdate(),
      onSelectionUpdate: () => forceUpdate(),
      immediatelyRender: false,
    });

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

    useImperativeHandle(ref, () => ({
      // appendContent: (html) => {
      //   if (editor) {
      //     editor.commands.insertContent(html);
      //   }
      // },
      getFormattedData: () => {
        if (editor) {
          const json = editor.getJSON();
          return transformEditorData(json);
        }
        return null;
      },
    }));

    // 2. Rasm o'zgarganda editor ichidagi diagramBlock'larni yangilash logikasi
    useEffect(() => {
      if (editor && diagramImage) {
        // Editor ichidagi barcha diagramBlock turlaridagi nodelarni qidiramiz
        editor.commands.command(({ tr, dispatch }) => {
          let hasChanged = false;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "diagramBlock") {
              // Agar rasm manzili hozirgi rasmga mos kelmasa, yangilaymiz
              if (node.attrs.src !== diagramImage) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    src: diagramImage,
                  });
                  hasChanged = true;
                }
              }
            }
          });
          return hasChanged;
        });
      }
    }, [diagramImage, editor]);

    if (!editor) return null;

    return (
      <div className="w-full border border-slate-200 rounded-xl bg-white shadow-xl flex flex-col min-h-[700px]">
        <div className="p-3 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
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

            {/* List ordered */}
            <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                title="Bullet List"
              >
                <List size={18} />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                title="Ordered List"
              >
                <ListOrdered size={18} />
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

            {/* IELTS Questions */}
            <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
              {/* Gap Fill (Sizda bor edi) */}
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "questionInput",
                      attrs: { number: getNextQuestionNumber(), answer: "" },
                    })
                    .run();
                }}
                title="Gap Fill"
              >
                <PlusCircle size={18} className="text-emerald-600" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "choiceGroup",
                      attrs: { questionNumber: getNextQuestionNumber() },
                      content: [
                        { type: "choiceItem", attrs: { isCorrect: false } },
                        { type: "choiceItem", attrs: { isCorrect: false } },
                      ],
                    })
                    .run();
                }}
                title="Add Choice Block"
              >
                <CheckSquare size={18} className="text-blue-600" />
              </ToolbarButton>
            </div>

            <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
              {/* Matching Headings */}
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "matchingBlock",
                      attrs: {
                        type: "matching-headings",
                        title: "List of Headings",
                      },
                      content: [
                        {
                          type: "matchingQuestion",
                          attrs: { number: getNextQuestionNumber() },
                        },
                      ],
                    })
                    .run();
                }}
                title="Matching Headings and Endings"
              >
                <Layers size={18} className="text-amber-600" />
              </ToolbarButton>

              {/* Matching Information */}
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "matchingBlock",
                      attrs: {
                        type: "matching-info",
                        title:
                          "Which paragraph contains the following information?",
                      },
                      content: [
                        {
                          type: "matchingQuestion",
                          attrs: { number: getNextQuestionNumber() },
                        },
                      ],
                    })
                    .run();
                }}
                title="Matching Info"
              >
                <ListTodo size={18} className="text-purple-600" />
              </ToolbarButton>

              {/* Matching Features/Names */}
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "matchingBlock",
                      attrs: {
                        type: "matching-features",
                        title:
                          "Look at the following statements and the list of people below",
                      },
                      content: [
                        {
                          type: "matchingQuestion",
                          attrs: { number: getNextQuestionNumber() },
                        },
                      ],
                    })
                    .run();
                }}
                title="Matching Features"
              >
                <UserCheck size={18} className="text-blue-600" />
              </ToolbarButton>
            </div>

            {/* True/False/Not Given */}
            {/* Yes/No/Not Given */}
            <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "booleanBlock",
                      attrs: {
                        type: "tfng",
                        title:
                          "TRUE if the statement agrees with the information...",
                      },
                      content: [
                        {
                          type: "booleanQuestion",
                          attrs: {
                            number: getNextQuestionNumber(),
                            type: "tfng",
                          },
                        },
                      ],
                    })
                    .run();
                }}
                title="True False Not Given"
              >
                <CheckCircle2 size={18} className="text-emerald-600" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "booleanBlock",
                      attrs: {
                        type: "ynng",
                        title:
                          "YES if the statement agrees with the claims of the writer...",
                      },
                      content: [
                        {
                          type: "booleanQuestion",
                          attrs: {
                            number: getNextQuestionNumber(),
                            type: "ynng",
                          },
                        },
                      ],
                    })
                    .run();
                }}
                title="Yes No Not Given"
              >
                <HelpCircle size={18} className="text-orange-600" />
              </ToolbarButton>
            </div>

            {/* Summary completion */}
            <div className="flex bg-white rounded border border-slate-200 p-1 shadow-sm">
              <ToolbarButton
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "summaryBlock",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "Write your summary text here and insert ",
                            },
                            {
                              type: "questionInput",
                              attrs: {
                                number: getNextQuestionNumber(),
                                answer: "",
                              },
                            },
                            { type: "text", text: " wherever you need a gap." },
                          ],
                        },
                      ],
                    })
                    .run();
                }}
                title="Summary Completion"
              >
                <div className="relative">
                  <Type size={18} className="text-slate-700" />
                  <PlusCircle
                    size={10}
                    className="absolute -top-1 -right-1 text-blue-600 fill-white"
                  />
                </div>
              </ToolbarButton>
            </div>

            {/* Guruh: Complex Layouts */}
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm gap-1">
              <ToolbarButton
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "diagramBlock",
                      attrs: { src: diagramImage }, // Rasmni shu yerda biriktiramiz
                    })
                    .run()
                }
                title="Diagram Labeling"
              >
                <MapPin size={18} className="text-red-600" />
              </ToolbarButton>
            </div>

            {/* <button
            type="button"
            onClick={() => handleSave()}
            className="ml-auto flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md"
          >
            <Save size={18} /> SAVE
          </button> */}
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
                type="button"
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
          /* List styles */
          .ProseMirror ul,
          .ProseMirror ol {
            padding: 0 1rem;
            margin: 1.25rem 1rem 1.25rem 0.4rem;
          }

          .ProseMirror ul {
            list-style-type: disc;
          }

          .ProseMirror ol {
            list-style-type: decimal;
          }

          .ProseMirror li {
            margin-bottom: 0.5rem;
          }

          /* Agar ro'yxat ichida paragraf bo'lsa, ortiqcha marginni olib tashlaymiz */
          .ProseMirror li p {
            margin: 0;
          }
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
);

CompletionQGenerator.displayName = "CompletionQGenerator";
export { CompletionQGenerator };

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
