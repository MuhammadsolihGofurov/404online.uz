/**
 * SummaryBuilder Component
 * Handles SUMMARY_FILL_BLANKS and SUMMARY_DRAG_DROP question types
 */

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { createId } from "../utils/questionConfig";
import { normalizeWordBankItems } from "../utils/questionUtils";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
  ),
});

// Define InsertMenu outside to prevent re-mounting
const InsertMenu = ({ onAddRow }) => (
  <div className="flex items-center justify-center py-1 group">
    <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
      <button
        type="button"
        onClick={() => onAddRow("subheading")}
        className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
        title="Insert sub-heading here"
      >
        <Plus size={12} className="inline mr-1" />
        Sub-heading
      </button>
      <button
        type="button"
        onClick={() => onAddRow("text")}
        className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
        title="Insert info row here"
      >
        <Plus size={12} className="inline mr-1" />
        Info Row
      </button>
      <button
        type="button"
        onClick={() => onAddRow("question")}
        className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
        title="Insert question row here"
      >
        <Plus size={12} className="inline mr-1" />
        Question
      </button>
    </div>
  </div>
);

export function SummaryBuilder({
  questionType,
  questionNumberStart,
  questionNumberEnd,
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const [wordBankInput, setWordBankInput] = useState("");

  const isDragDrop = questionType === "SUMMARY_DRAG_DROP";
  const isGrouped = questionNumberEnd > questionNumberStart;
  const summaryType = content?.summary_type || "story";
  const items = content?.items || [];
  const rows = content?.rows || [];
  const text = content?.text || "";
  const answers = correctAnswer?.values || {};
  const wordBank = content?.word_bank || [];
  const normalizedWordBank = normalizeWordBankItems(wordBank);

  const handleModeChange = useCallback((newMode) => {
    const grouped = questionNumberEnd > questionNumberStart;
    let newContent = { ...content, summary_type: newMode };

    if (newMode === "story") {
      if (!newContent.text) {
        newContent.text = "";
      }
    } else if (!newContent.rows || newContent.rows.length === 0) {
      const newRows = [];
      if (grouped) {
        for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
          newRows.push({
            type: "question",
            id: String(i),
            pre_text: "",
            blank_id: String(i),
            post_text: "",
          });
        }
      } else {
        newRows.push({
          type: "question",
          id: String(questionNumberStart),
          pre_text: "",
          blank_id: String(questionNumberStart),
          post_text: "",
        });
      }
      newContent.rows = newRows;
    }

    onContentChange(newContent);
  }, [content, questionNumberStart, questionNumberEnd, onContentChange]);

  const updateRow = useCallback((index, key, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [key]: value };
    onContentChange({ ...content, rows: newRows });
  }, [rows, content, onContentChange]);

  const updateAnswerValue = useCallback((itemId, value) => {
    onAnswerChange({
      values: {
        ...answers,
        [itemId]: value,
      },
    });
  }, [answers, onAnswerChange]);

  const renderAnswerControl = useCallback((blankId, placeholder) => {
    const baseClass =
      "flex-1 px-3 py-2 text-sm border border-dashed rounded-lg border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10";
    if (isDragDrop) {
      return (
        <select
          value={answers[blankId] || ""}
          onChange={(e) => updateAnswerValue(blankId, e.target.value)}
          className={baseClass}
          disabled={!normalizedWordBank.length}
        >
          <option value="">
            {normalizedWordBank.length ? "Select word" : "Add words to the bank"}
          </option>
          {normalizedWordBank.map((word) => (
            <option key={word.id} value={word.value}>
              {word.text}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={answers[blankId] || ""}
        onChange={(e) => updateAnswerValue(blankId, e.target.value)}
        placeholder={placeholder}
        className={baseClass}
      />
    );
  }, [isDragDrop, answers, normalizedWordBank, updateAnswerValue]);

  const handleAddWordToBank = useCallback(() => {
    const trimmed = wordBankInput.trim();
    if (!trimmed) return;

    const duplicate = normalizedWordBank.some(
      (word) => word.text?.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      toast.info("Word already exists in the bank.");
      return;
    }

    const nextWord = {
      id: createId(),
      text: trimmed,
      value: trimmed,
    };
    onContentChange({
      ...content,
      word_bank: [...wordBank, nextWord],
    });
    setWordBankInput("");
  }, [wordBankInput, normalizedWordBank, content, wordBank, onContentChange]);

  const handleRemoveWordFromBank = useCallback((wordItem) => {
    const updatedBank = wordBank.filter((_, idx) => idx !== wordItem.originalIndex);
    onContentChange({
      ...content,
      word_bank: updatedBank,
    });

    const currentValues = correctAnswer?.values || {};
    if (Object.keys(currentValues).length) {
      const newValues = { ...currentValues };
      const removalCandidates = [wordItem.value, wordItem.id, wordItem.text]
        .filter(Boolean)
        .map((candidate) => String(candidate));

      Object.keys(newValues).forEach((key) => {
        if (
          newValues[key] &&
          removalCandidates.includes(String(newValues[key]))
        ) {
          newValues[key] = "";
        }
      });

      onAnswerChange({ values: newValues });
    }
  }, [wordBank, content, correctAnswer, onContentChange, onAnswerChange]);

  const addRow = useCallback((type = "question", insertAfterIndex = null) => {
    let newRow;
    if (type === "heading") {
      newRow = {
        type: "heading",
        text: "",
        style: "h4",
      };
    } else if (type === "subheading") {
      newRow = {
        type: "subheading",
        text: "",
        style: "h5",
      };
    } else if (type === "text") {
      newRow = {
        type: "text",
        text: "",
        style: "bullet",
      };
    } else {
      const questionRows = rows.filter(r => r.type === "question" || !r.type);
      const nextId = questionRows.length > 0
        ? String(Math.max(...questionRows.map(r => Number(r.blank_id || r.id || 0))) + 1)
        : String(questionNumberStart + questionRows.length);
      newRow = {
        type: "question",
        id: nextId,
        pre_text: "",
        blank_id: nextId,
        post_text: "",
      };
    }

    const newRows = [...rows];
    if (insertAfterIndex !== null) {
      newRows.splice(insertAfterIndex + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }
    onContentChange({ ...content, rows: newRows });
  }, [rows, content, questionNumberStart, onContentChange]);

  const removeRow = useCallback((index) => {
    const newRows = rows.filter((_, i) => i !== index);
    onContentChange({ ...content, rows: newRows });
  }, [rows, content, onContentChange]);

  const moveRow = useCallback((index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === rows.length - 1)
    ) {
      return;
    }
    const newRows = [...rows];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
    onContentChange({ ...content, rows: newRows });
  }, [rows, content, onContentChange]);

  const renderWordBankManager = () => {
    if (!isDragDrop) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Word Bank</p>
            <p className="text-xs text-slate-500">
              Add all possible answers (correct + distractors). Each blank will select from this list.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {normalizedWordBank.length} word{normalizedWordBank.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={wordBankInput}
            onChange={(e) => setWordBankInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddWordToBank();
              }
            }}
            placeholder="Enter a word or phrase"
            className="flex-1 px-3 py-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
          />
          <button
            type="button"
            onClick={handleAddWordToBank}
            className="px-4 py-2 text-sm font-semibold text-white rounded-2xl bg-main hover:bg-main/90"
          >
            Add Word
          </button>
        </div>

        {normalizedWordBank.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {normalizedWordBank.map((word) => (
              <span
                key={word.id}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-full bg-slate-100 text-slate-700 border-slate-200"
              >
                {word.text}
                <button
                  type="button"
                  onClick={() => handleRemoveWordFromBank(word)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label={`Remove ${word.text}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="p-3 text-xs text-center border border-dashed text-slate-500 rounded-2xl border-slate-300 bg-slate-50">
            No words added yet. Start by adding the correct answers and optional distractors.
          </div>
        )}
      </div>
    );
  };

  const renderStoryMode = () => {
    const blanks = content?.blanks || [];

    return (
      <div className="space-y-4">
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Story Mode (Rich Text Editor)
            </p>
          </div>
          <p className="text-xs text-blue-700">
            Type placeholders like <code className="px-1 bg-white rounded">___(1)___</code> in the text to generate answer fields below.
          </p>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Summary Text
          </label>
          <ReactQuill
            theme="snow"
            value={text}
            onChange={(value) => onContentChange({ ...content, text: value })}
            placeholder="Enter your summary text with blanks (e.g., ___(6)___)"
          />
        </div>

        {blanks.length > 0 && (
          <div className="space-y-3">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Correct Answers
              </label>
              <p className="mb-3 text-xs text-slate-500">
                Answer fields are automatically generated from placeholders in your text.
              </p>
            </div>
            <div className="space-y-3">
              {blanks.map((blankId) => (
                <div
                  key={blankId}
                  className="flex items-center gap-3 p-3 bg-white border rounded-lg border-slate-200"
                >
                  <label className="text-sm font-semibold text-slate-600 min-w-[80px]">
                    Blank {blankId}
                  </label>
                  {renderAnswerControl(blankId, `Correct answer for blank ${blankId}`)}
                </div>
              ))}
            </div>
          </div>
        )}

        {blanks.length === 0 && text && (
          <div className="p-4 text-sm text-center border border-dashed text-slate-500 rounded-xl border-slate-300 bg-slate-50">
            No blanks detected. Add placeholders like <code className="px-1 bg-white rounded">___(1)___</code> in your text above.
          </div>
        )}
      </div>
    );
  };

  const renderListMode = () => {
    const isNumbered = summaryType === "numbered";

    return (
      <div className="space-y-4">
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              {isNumbered ? "Numbered List Mode" : "Bullet List Mode"}
            </p>
          </div>
          <p className="text-xs text-blue-700">
            {isGrouped
              ? `Question range Q${questionNumberStart}-${questionNumberEnd} automatically generates rows.`
              : `Single question Q${questionNumberStart}. Add more rows as needed.`
            }
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Summary Rows
              </label>
              <p className="mt-1 text-xs text-slate-500">
                {rows.length} row{rows.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => addRow("heading")}
              className="px-3 py-1.5 text-xs font-medium transition bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
            >
              + Heading
            </button>
          </div>

          <div className="space-y-1">
            {rows.map((row, index) => {
              // Render heading/subheading rows
              if (row.type === "heading" || row.type === "subheading") {
                return (
                  <React.Fragment key={index}>
                    <div className="flex items-center gap-2 p-4 border bg-slate-50 rounded-xl border-slate-200">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveRow(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRow(index, "down")}
                          disabled={index === rows.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                      <input
                        type="text"
                        value={row.text || ""}
                        onChange={(e) => updateRow(index, "text", e.target.value)}
                        placeholder={row.type === "heading" ? "Heading text (e.g., Cruise on a lake)..." : "Sub-heading text..."}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10 ${
                          row.type === "heading" ? "font-bold" : "font-semibold"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-2 text-red-500 hover:text-red-600"
                        title="Delete heading"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <InsertMenu onAddRow={(type) => addRow(type, index)} />
                  </React.Fragment>
                );
              }

              // Render text-only rows
              if (row.type === "text") {
                const listItemIndex = rows.slice(0, index).filter(r =>
                  r.type === "text" || r.type === "question" || !r.type
                ).length;

                return (
                  <React.Fragment key={index}>
                    <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-2">
                          <button
                            type="button"
                            onClick={() => moveRow(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(index, "down")}
                            disabled={index === rows.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <span className="text-xs font-semibold text-center text-slate-500">
                            {isNumbered ? listItemIndex + 1 : "•"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <label className="block mb-1 text-xs font-medium text-slate-600">
                            Info Text (No blank)
                          </label>
                          <input
                            type="text"
                            value={row.text || ""}
                            onChange={(e) => updateRow(index, "text", e.target.value)}
                            placeholder="Enter informational text"
                            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-2 text-red-500 hover:text-red-600"
                          title="Delete info row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <InsertMenu onAddRow={(type) => addRow(type, index)} />
                  </React.Fragment>
                );
              }

              // Render question rows
              const questionIndex = rows.slice(0, index).filter(r => r.type === "question" || !r.type).length;

              return (
                <React.Fragment key={index}>
                  <div className="p-4 bg-white border rounded-xl border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 pt-2">
                        <button
                          type="button"
                          onClick={() => moveRow(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRow(index, "down")}
                          disabled={index === rows.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <span className="text-xs font-semibold text-center text-slate-500">
                          {isNumbered ? questionIndex + 1 : "•"}
                        </span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600 min-w-[40px]">
                            Q{row.blank_id || row.id}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">
                            Row Text Structure
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.pre_text || ""}
                              onChange={(e) => updateRow(index, "pre_text", e.target.value)}
                              placeholder="Text before blank"
                              className="flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                            />
                            <div className="px-4 py-2 font-mono text-xs font-semibold text-center border-2 border-dashed rounded-lg text-slate-600 bg-slate-50 border-slate-300 whitespace-nowrap">
                              ___( {row.blank_id || row.id} )___
                            </div>
                            <input
                              type="text"
                              value={row.post_text || ""}
                              onChange={(e) => updateRow(index, "post_text", e.target.value)}
                              placeholder="Text after blank"
                              className="flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-slate-600">
                            Correct Answer
                          </label>
                          {renderAnswerControl(row.blank_id || row.id, "Correct answer for this blank")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (row.type === "question" || !row.type) {
                            if (confirm("Are you sure you want to delete this question row?")) {
                              removeRow(index);
                            }
                          } else {
                            removeRow(index);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-600"
                        title="Delete row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <InsertMenu onAddRow={(type) => addRow(type, index)} />
                </React.Fragment>
              );
            })}
          </div>

          {rows.length === 0 && (
            <div className="p-6 text-sm text-center border border-dashed text-slate-500 rounded-xl border-slate-300">
              No rows yet. Click "+ Heading" to start.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Layout Mode Selector */}
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-700">
          Layout Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange("story")}
            className={`p-4 rounded-xl border-2 transition ${
              summaryType === "story"
                ? "border-main bg-main/10 text-main"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="mb-1 text-sm font-semibold">Story</div>
            <div className="text-xs text-slate-500">Rich Text Editor</div>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("bullet")}
            className={`p-4 rounded-xl border-2 transition ${
              summaryType === "bullet"
                ? "border-main bg-main/10 text-main"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="mb-1 text-sm font-semibold">Bullet List</div>
            <div className="text-xs text-slate-500">Dynamic List</div>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("numbered")}
            className={`p-4 rounded-xl border-2 transition ${
              summaryType === "numbered"
                ? "border-main bg-main/10 text-main"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="mb-1 text-sm font-semibold">Numbered List</div>
            <div className="text-xs text-slate-500">Auto-numbered</div>
          </button>
        </div>
      </div>

      {/* Mode-specific content */}
      {summaryType === "story" ? renderStoryMode() : renderListMode()}

      {renderWordBankManager()}

      {/* Word Limit */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Word limit per blank
        </label>
        <input
          type="number"
          min={1}
          max={5}
          value={content?.word_limit || ""}
          onChange={(e) =>
            onContentChange({
              ...content,
              word_limit: Number(e.target.value),
            })
          }
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
      </div>
    </div>
  );
}

