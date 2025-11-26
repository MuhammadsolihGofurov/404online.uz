/**
 * SummaryBuilder Component (Story Mode Only)
 * Handles SUMMARY_FILL_BLANKS and SUMMARY_DRAG_DROP question types
 * Simplified version - uses rich text editor exclusively
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { Sparkles } from "lucide-react";
import { createId } from "../utils/questionConfig";
import { normalizeWordBankItems, extractBlanksFromText } from "../utils/questionUtils";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
  ),
});

/**
 * AnswerInputControl - Memoized component for answer input
 * Prevents re-mounting and focus loss
 */
const AnswerInputControl = React.memo(({ 
  blankId, 
  placeholder, 
  isDragDrop, 
  currentValue,
  normalizedWordBank,
  onUpdate 
}) => {
  const baseClass =
    "flex-1 px-3 py-2 text-sm border border-dashed rounded-lg border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10";

  if (isDragDrop) {
    return (
      <select
        value={currentValue || ""}
        onChange={(e) => onUpdate(blankId, e.target.value)}
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
      value={currentValue || ""}
      onChange={(e) => onUpdate(blankId, e.target.value)}
      placeholder={placeholder}
      className={baseClass}
    />
  );
});
AnswerInputControl.displayName = 'AnswerInputControl';

export function SummaryBuilder({
  questionType,
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const [wordBankInput, setWordBankInput] = useState("");
  
  // Use ref to avoid recreating callbacks when correctAnswer changes
  const correctAnswerRef = useRef(correctAnswer);
  useEffect(() => {
    correctAnswerRef.current = correctAnswer;
  }, [correctAnswer]);

  const isDragDrop = questionType === "SUMMARY_DRAG_DROP";
  const text = content?.text || "";
  const answers = correctAnswer?.values || {};
  const wordBank = content?.word_bank || [];
  
  // 🛡️ CRITICAL: Safety limit to prevent browser crash
  // Even if bad data gets in (e.g., 1000 blanks), never render more than 50
  const MAX_SAFE_BLANKS = 50;
  const blanks = content?.blanks || [];
  const safeBlanks = blanks.length > MAX_SAFE_BLANKS ? blanks.slice(0, MAX_SAFE_BLANKS) : blanks;
  const hasExceededLimit = blanks.length > MAX_SAFE_BLANKS;
  
  // ✅ Memoize to prevent recreation on every render
  const normalizedWordBank = useMemo(
    () => normalizeWordBankItems(wordBank),
    [wordBank]
  );

  // Auto-detect blanks from text in Story Mode
  useEffect(() => {
    if (!text) return;

    // Extract blanks using robust regex
    const detectedBlanks = extractBlanksFromText(text);
    const currentBlanks = content?.blanks || [];

    // Check if blanks have changed
    const blanksChanged =
      detectedBlanks.length !== currentBlanks.length ||
      detectedBlanks.some((id, idx) => id !== currentBlanks[idx]);

    if (blanksChanged) {
      // Update content with new blanks array
      onContentChange({
        ...content,
        blanks: detectedBlanks,
      });

      // Clean up answers for removed blanks
      const newAnswers = { ...answers };
      let answersChanged = false;

      // Remove answers for blanks that no longer exist
      Object.keys(newAnswers).forEach((key) => {
        if (!detectedBlanks.includes(key)) {
          delete newAnswers[key];
          answersChanged = true;
        }
      });

      if (answersChanged) {
        onAnswerChange({ values: newAnswers });
      }
    }
  }, [text, content, answers, onContentChange, onAnswerChange]);

  const updateAnswerValue = useCallback((itemId, value) => {
    // Use ref to get latest correctAnswer without recreating callback
    const currentValues = correctAnswerRef.current?.values || {};
    onAnswerChange({
      values: {
        ...currentValues,
        [itemId]: value,
      },
    });
  }, [onAnswerChange]);

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

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-900">
            Story Mode (Rich Text Editor)
          </p>
        </div>
        <p className="text-xs text-blue-700">
          Type placeholders like <code className="px-1 bg-white rounded">___(1)___</code> or{" "}
          <code className="px-1 bg-white rounded">___ (2) ___</code> in the text to generate answer fields below.
          You can also use formatting, bullets, and numbering from the editor toolbar.
        </p>
      </div>

      {/* Rich Text Editor */}
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-700">
          Summary Text
        </label>
        <ReactQuill
          theme="snow"
          value={text}
          onChange={(value) => onContentChange({ ...content, text: value })}
          placeholder="Enter your summary text with blanks (e.g., The weather was ___(6)___ and sunny.)"
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "code-block"],
              [{ color: [] }, { background: [] }],
              ["link"],
              ["clean"],
            ],
          }}
        />
      </div>

      {/* Safety Warning */}
      {hasExceededLimit && (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
          <p className="font-semibold text-red-700">⚠️ Blank Limit Exceeded</p>
          <p className="text-sm text-red-600">
            You have {blanks.length} blanks, but only the first {MAX_SAFE_BLANKS} are shown to prevent browser crash.
            Please reduce the number of blanks in your text.
          </p>
        </div>
      )}

      {/* Correct Answers Section */}
      {safeBlanks.length > 0 && (
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
            {safeBlanks.map((blankId) => (
              <div
                key={blankId}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg border-slate-200"
              >
                <label className="text-sm font-semibold text-slate-600 min-w-[80px]">
                  Blank {blankId}
                </label>
                <AnswerInputControl
                  blankId={blankId}
                  placeholder={`Correct answer for blank ${blankId}`}
                  isDragDrop={isDragDrop}
                  currentValue={answers[blankId]}
                  normalizedWordBank={normalizedWordBank}
                  onUpdate={updateAnswerValue}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Blanks Detected Message */}
      {safeBlanks.length === 0 && text && (
        <div className="p-4 text-sm text-center border border-dashed text-slate-500 rounded-xl border-slate-300 bg-slate-50">
          No blanks detected. Add placeholders like <code className="px-1 bg-white rounded">___(1)___</code> in your text above.
        </div>
      )}

      {/* Word Bank Manager (for Drag & Drop mode) */}
      {renderWordBankManager()}

      {/* Word Limit */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Word limit per blank
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Maximum words students can enter per blank (typically 1-3 for IELTS)
        </p>
        <select
          value={content?.word_limit || 1}
          onChange={(e) =>
            onContentChange({
              ...content,
              word_limit: Number(e.target.value),
            })
          }
          className="w-full px-4 py-3 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10 bg-white"
        >
          <option value={1}>1 word</option>
          <option value={2}>2 words</option>
          <option value={3}>3 words</option>
          <option value={4}>4 words</option>
          <option value={5}>5 words</option>
        </select>
      </div>
    </div>
  );
}
