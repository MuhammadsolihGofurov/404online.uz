import React, { useMemo, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";

import { ReadOnlyQuestionInput } from "./extensions/readonly-question-input";
import { ReadOnlyChoiceGroup } from "./extensions/readonly-choice-group";
import { ReadOnlyChoiceItem } from "./extensions/readonly-choice-item";
import {
  ReadOnlyMatchingBlock,
  ReadOnlyMatchingQuestion,
} from "./extensions/readonly-matching-extension";
import { ReadOnlyMatchingAnswerSlot } from "./extensions/readonly-matching-answer-slot";
import { ReadOnlyMatchingDragOptions } from "./extensions/readonly-matching-drag-options";
import {
  ReadOnlyBooleanBlock,
  ReadOnlyBooleanQuestion,
} from "./extensions/readonly-boolean-extension";
import { ReadOnlyDiagramBlock } from "./extensions/readonly-diagram-extension";
import { ReadOnlySummaryBlock } from "./extensions/readonly-summary-extension";
import { WordBankHandler } from "./extensions/word-bank-handler";
import { ReadOnlyDragItem } from "./extensions/readonly-drag-item";

const TiptapQuestionRenderer = forwardRef(function TiptapQuestionRenderer(
  { content, answers = {}, onAnswerChange, hideInputs = false },
  ref
) {
  // Use refs to store latest values so extensions can always access them
  const answersRef = React.useRef(answers);
  const onAnswerChangeRef = React.useRef(onAnswerChange);
  const hideInputsRef = React.useRef(hideInputs);

  // Update refs on every render
  React.useEffect(() => {
    answersRef.current = answers;
    onAnswerChangeRef.current = onAnswerChange;
    hideInputsRef.current = hideInputs;
  });

  // Create extensions only once - don't include answers/onAnswerChange in deps
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false, // Disable from StarterKit to use explicit config
        orderedList: false,
        listItem: false,
      }),
      BulletList,
      OrderedList,
      ListItem,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      TextStyle,
      Color,
      ReadOnlyQuestionInput.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyChoiceGroup.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
        hideInputs: hideInputsRef,
      }),
      ReadOnlyChoiceItem.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyMatchingBlock.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
        hideInputs: hideInputsRef,
      }),
      ReadOnlyMatchingQuestion.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
        hideInputs: hideInputsRef,
      }),
      ReadOnlyMatchingAnswerSlot.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
        hideInputs: hideInputsRef,
      }),
      ReadOnlyMatchingDragOptions.configure({
        answers: answersRef,
      }),
      ReadOnlyBooleanBlock.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyBooleanQuestion.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyDiagramBlock.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlySummaryBlock.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyDragItem.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
    ],
    [] // Empty deps - only create once
  );

  const editor = useEditor(
    {
      extensions,
      content,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose prose-lg max-w-none focus:outline-none",
        },
      },
      onCreate: ({ editor }) => {
        // Update options immediately when editor is created
        editor.extensionManager.extensions.forEach((ext) => {
          if (
            ext.name === "questionInput" ||
            ext.name === "choiceGroup" ||
            ext.name === "choiceItem" ||
            ext.name === "matchingBlock" ||
            ext.name === "matchingQuestion" ||
            ext.name === "booleanBlock" ||
            ext.name === "booleanQuestion" ||
            ext.name === "diagramBlock" ||
            ext.name === "summaryBlock"
          ) {
            ext.options.answers = answersRef.current;
            ext.options.onAnswerChange = onAnswerChangeRef.current;
          }
        });
      },
    },
    [content] // Only recreate when content changes
  );

  // Update editor options when answers change
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.extensionManager.extensions.forEach((ext) => {
        if (
          ext.name === "questionInput" ||
          ext.name === "choiceGroup" ||
          ext.name === "choiceItem" ||
          ext.name === "matchingBlock" ||
          ext.name === "matchingQuestion" ||
          ext.name === "booleanBlock" ||
          ext.name === "booleanQuestion" ||
          ext.name === "diagramBlock" ||
          ext.name === "summaryBlock"
        ) {
          ext.options.answers = answers;
          ext.options.onAnswerChange = onAnswerChange;
        }
      });
    }
  }, [editor, answers]);

  // Expose focusQuestion method to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      focusQuestion: (questionNumber) => {
        if (!questionNumber) return;

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          // First try to find an input element
          let element = document.querySelector(
            `[data-question-number="${questionNumber}"]`
          );

          // If not found, try to find a choice-group container
          if (!element) {
            element = document.querySelector(
              `.choice-group-container[data-question-number="${questionNumber}"]`
            );
          }

          if (element) {
            // For input elements, focus them
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
              element.focus();
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              // For choice groups and other elements, focus and scroll
              element.focus();
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }, 100);
      },
    }),
    []
  );

  // Setup drag-and-drop for word-bank items is now handled by WordBankHandler component

  if (!editor) {
    return <div className="text-gray-400 italic">Loading question...</div>;
  }

  return (
    <>
      <WordBankHandler />
      <style jsx global>{`
        .tiptap-question-renderer ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin: 1rem 0;
        }
        .tiptap-question-renderer ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin: 1rem 0;
        }
        .tiptap-question-renderer li {
          margin: 0.5rem 0;
        }
        .tiptap-question-renderer li > p {
          margin: 0;
        }
      `}</style>
      <EditorContent editor={editor} className="tiptap-question-renderer" />
    </>
  );
});

export default TiptapQuestionRenderer;
