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

import { ReadOnlyQuestionInput } from "./extensions/readonly-question-input";
import { ReadOnlyChoiceGroup } from "./extensions/readonly-choice-group";
import { ReadOnlyChoiceItem } from "./extensions/readonly-choice-item";
import {
  ReadOnlyMatchingBlock,
  ReadOnlyMatchingQuestion,
} from "./extensions/readonly-matching-extension";
import {
  ReadOnlyBooleanBlock,
  ReadOnlyBooleanQuestion,
} from "./extensions/readonly-boolean-extension";
import { ReadOnlyDiagramBlock } from "./extensions/readonly-diagram-extension";
import { ReadOnlySummaryBlock } from "./extensions/readonly-summary-extension";

const TiptapQuestionRenderer = forwardRef(function TiptapQuestionRenderer(
  { content, answers = {}, onAnswerChange },
  ref
) {
  // Use refs to store latest values so extensions can always access them
  const answersRef = React.useRef(answers);
  const onAnswerChangeRef = React.useRef(onAnswerChange);

  // Update refs on every render
  React.useEffect(() => {
    answersRef.current = answers;
    onAnswerChangeRef.current = onAnswerChange;
  });

  // Create extensions only once - don't include answers/onAnswerChange in deps
  const extensions = useMemo(
    () => [
      StarterKit,
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
      }),
      ReadOnlyChoiceItem.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyMatchingBlock.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
      }),
      ReadOnlyMatchingQuestion.configure({
        answers: answersRef,
        onAnswerChange: onAnswerChangeRef,
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
            ext.options.answers = answers;
            ext.options.onAnswerChange = onAnswerChange;
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
      // Force re-render of node views
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, answers]); // Remove onAnswerChange from deps since it doesn't trigger re-render

  // Expose focusQuestion method to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      focusQuestion: (questionNumber) => {
        if (!questionNumber) return;

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const input = document.querySelector(
            `[data-question-number="${questionNumber}"]`
          );
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      },
    }),
    []
  );

  if (!editor) {
    return <div className="text-gray-400 italic">Loading question...</div>;
  }

  return <EditorContent editor={editor} className="tiptap-question-renderer" />;
});

export default TiptapQuestionRenderer;
