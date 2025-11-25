# Implementation Examples for Enhanced Data Structure

## Quick Reference: How to Implement Proposed Solutions

---

## 1. Answer Variants Support (SHORT_ANSWER)

### Frontend Changes

#### A. Update `questionConfig.js`:

```javascript
// utils/questionConfig.js

export const defaultAnswerByType = {
  // ... other types ...
  
  SHORT_ANSWER: (questionNumberStart = 1, questionNumberEnd = 1) => {
    const singleAnswer = {
      primary: "",
      accepted_variants: [],
      matching_rules: {
        case_sensitive: false,
        trim_whitespace: true,
        allow_punctuation_variance: false
      }
    };
    
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = { ...singleAnswer };
      }
      return { values };
    }
    return singleAnswer;
  },
};
```

#### B. Create `ShortAnswerBuilder.jsx` Enhancement:

```javascript
// builders/ShortAnswerBuilderEnhanced.jsx

import React, { useCallback, useState } from "react";
import { Plus, X, Settings } from "lucide-react";

export function ShortAnswerBuilderEnhanced({
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
  questionNumberStart,
  questionNumberEnd,
}) {
  const isGrouped = questionNumberEnd > questionNumberStart;
  const [expandedSettings, setExpandedSettings] = useState({});

  const updateSingleAnswer = useCallback((field, value) => {
    onAnswerChange({
      ...correctAnswer,
      [field]: value,
    });
  }, [correctAnswer, onAnswerChange]);

  const updateGroupedAnswer = useCallback((questionId, field, value) => {
    const values = { ...(correctAnswer?.values || {}) };
    values[questionId] = {
      ...(values[questionId] || {}),
      [field]: value,
    };
    onAnswerChange({ values });
  }, [correctAnswer, onAnswerChange]);

  const addVariant = useCallback((questionId = null) => {
    if (isGrouped && questionId) {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[questionId] || { primary: "", accepted_variants: [] };
      const variants = current.accepted_variants || [];
      
      values[questionId] = {
        ...current,
        accepted_variants: [
          ...variants,
          { value: "", score_percentage: 100 }
        ]
      };
      onAnswerChange({ values });
    } else {
      const variants = correctAnswer?.accepted_variants || [];
      updateSingleAnswer("accepted_variants", [
        ...variants,
        { value: "", score_percentage: 100 }
      ]);
    }
  }, [isGrouped, correctAnswer, updateSingleAnswer, onAnswerChange]);

  const removeVariant = useCallback((variantIndex, questionId = null) => {
    if (isGrouped && questionId) {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[questionId];
      const variants = [...(current?.accepted_variants || [])];
      variants.splice(variantIndex, 1);
      
      values[questionId] = {
        ...current,
        accepted_variants: variants
      };
      onAnswerChange({ values });
    } else {
      const variants = [...(correctAnswer?.accepted_variants || [])];
      variants.splice(variantIndex, 1);
      updateSingleAnswer("accepted_variants", variants);
    }
  }, [isGrouped, correctAnswer, updateSingleAnswer, onAnswerChange]);

  const updateVariant = useCallback((variantIndex, field, value, questionId = null) => {
    if (isGrouped && questionId) {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[questionId];
      const variants = [...(current?.accepted_variants || [])];
      variants[variantIndex] = {
        ...variants[variantIndex],
        [field]: value
      };
      
      values[questionId] = {
        ...current,
        accepted_variants: variants
      };
      onAnswerChange({ values });
    } else {
      const variants = [...(correctAnswer?.accepted_variants || [])];
      variants[variantIndex] = {
        ...variants[variantIndex],
        [field]: value
      };
      updateSingleAnswer("accepted_variants", variants);
    }
  }, [isGrouped, correctAnswer, updateSingleAnswer, onAnswerChange]);

  const updateMatchingRules = useCallback((rule, value, questionId = null) => {
    if (isGrouped && questionId) {
      const values = { ...(correctAnswer?.values || {}) };
      const current = values[questionId];
      
      values[questionId] = {
        ...current,
        matching_rules: {
          ...(current?.matching_rules || {}),
          [rule]: value
        }
      };
      onAnswerChange({ values });
    } else {
      const matching_rules = {
        ...(correctAnswer?.matching_rules || {}),
        [rule]: value
      };
      updateSingleAnswer("matching_rules", matching_rules);
    }
  }, [isGrouped, correctAnswer, updateSingleAnswer, onAnswerChange]);

  const renderAnswerFields = (questionId = null) => {
    const answerData = isGrouped 
      ? (correctAnswer?.values?.[questionId] || {})
      : correctAnswer || {};
    
    const primary = answerData.primary || "";
    const variants = answerData.accepted_variants || [];
    const matchingRules = answerData.matching_rules || {
      case_sensitive: false,
      trim_whitespace: true,
      allow_punctuation_variance: false
    };

    const settingsKey = questionId || 'single';
    const isSettingsExpanded = expandedSettings[settingsKey];

    return (
      <div className="space-y-4">
        {/* Primary Answer */}
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Primary Answer (Model Answer)
          </label>
          <input
            type="text"
            value={primary}
            onChange={(e) => {
              if (isGrouped && questionId) {
                updateGroupedAnswer(questionId, "primary", e.target.value);
              } else {
                updateSingleAnswer("primary", e.target.value);
              }
            }}
            placeholder="e.g., bus stop"
            className="w-full px-3 py-2 mt-1 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
          />
        </div>

        {/* Accepted Variants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Accepted Variants (IELTS Scoring)
            </label>
            <button
              type="button"
              onClick={() => addVariant(questionId)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs text-white rounded-full bg-main"
            >
              <Plus size={12} />
              Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs italic text-slate-400">
              No variants added. Only exact match of primary answer will be accepted.
            </p>
          ) : (
            <div className="space-y-2">
              {variants.map((variant, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={variant.value || ""}
                    onChange={(e) => updateVariant(idx, "value", e.target.value, questionId)}
                    placeholder="e.g., bus-stop"
                    className="flex-1 px-3 py-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={variant.score_percentage || 100}
                    onChange={(e) => updateVariant(idx, "score_percentage", Number(e.target.value), questionId)}
                    className="w-20 px-3 py-2 text-sm text-center border rounded-xl border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(idx, questionId)}
                    className="p-2 text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matching Rules (Collapsible) */}
        <div className="pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setExpandedSettings(prev => ({
              ...prev,
              [settingsKey]: !prev[settingsKey]
            }))}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600"
          >
            <Settings size={14} />
            Matching Rules
            <span className="text-slate-400">
              {isSettingsExpanded ? "▼" : "▶"}
            </span>
          </button>

          {isSettingsExpanded && (
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!matchingRules.case_sensitive}
                  onChange={(e) => updateMatchingRules("case_sensitive", !e.target.checked, questionId)}
                  className="w-4 h-4 rounded text-main focus:ring-main"
                />
                <span className="text-xs text-slate-600">
                  Case insensitive (Bus Stop = bus stop)
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={matchingRules.trim_whitespace}
                  onChange={(e) => updateMatchingRules("trim_whitespace", e.target.checked, questionId)}
                  className="w-4 h-4 rounded text-main focus:ring-main"
                />
                <span className="text-xs text-slate-600">
                  Ignore extra spaces
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={matchingRules.allow_punctuation_variance}
                  onChange={(e) => updateMatchingRules("allow_punctuation_variance", e.target.checked, questionId)}
                  className="w-4 h-4 rounded text-main focus:ring-main"
                />
                <span className="text-xs text-slate-600">
                  Allow punctuation differences (bus-stop = bus stop)
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Content fields (word limit, pre/post text) - unchanged */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Answer length limit (words)
        </label>
        <input
          type="number"
          min={1}
          value={content?.answer_length_limit || 3}
          onChange={(e) =>
            onContentChange({
              ...content,
              answer_length_limit: Number(e.target.value),
            })
          }
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
      </div>

      {/* Answer Fields */}
      {isGrouped ? (
        <div className="space-y-6">
          <h4 className="text-sm font-semibold text-slate-700">
            Set Answers for Q{questionNumberStart} - Q{questionNumberEnd}
          </h4>
          {Array.from(
            { length: questionNumberEnd - questionNumberStart + 1 },
            (_, idx) => {
              const qNum = String(questionNumberStart + idx);
              return (
                <div key={qNum} className="p-4 border rounded-2xl border-slate-200">
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Question {qNum}
                  </p>
                  {renderAnswerFields(qNum)}
                </div>
              );
            }
          )}
        </div>
      ) : (
        <div className="p-4 border rounded-2xl border-slate-200">
          {renderAnswerFields()}
        </div>
      )}
    </div>
  );
}
```

---

## 2. Word Bank Orphan Protection

### A. Update `questionUtils.js`:

```javascript
// utils/questionUtils.js

/**
 * Check if a word from word bank is referenced in answers
 */
export const isWordReferenced = (wordId, wordValue, answers = {}) => {
  return Object.values(answers).some(answer => {
    if (!answer) return false;
    
    // Handle both old format (string) and new format (object)
    if (typeof answer === 'string') {
      return answer === wordValue;
    }
    
    if (typeof answer === 'object') {
      return answer.word_id === wordId || answer.word_value === wordValue;
    }
    
    return false;
  });
};

/**
 * Get all blank IDs that reference a specific word
 */
export const getBlankIdsForWord = (wordId, wordValue, answers = {}) => {
  return Object.entries(answers)
    .filter(([_, answerValue]) => {
      if (typeof answerValue === 'string') {
        return answerValue === wordValue;
      }
      if (typeof answerValue === 'object') {
        return answerValue.word_id === wordId || answerValue.word_value === wordValue;
      }
      return false;
    })
    .map(([blankId, _]) => blankId);
};

/**
 * Compute reference counts for word bank items
 */
export const enrichWordBankWithReferences = (wordBank = [], answers = {}) => {
  return wordBank.map(word => {
    const blankIds = getBlankIdsForWord(word.id, word.value, answers);
    return {
      ...word,
      is_referenced: blankIds.length > 0,
      reference_count: blankIds.length,
      referenced_blanks: blankIds
    };
  });
};
```

### B. Update `SummaryBuilder.jsx`:

```javascript
// builders/SummaryBuilder.jsx - Enhanced word bank deletion

import { isWordReferenced, getBlankIdsForWord, enrichWordBankWithReferences } from "../utils/questionUtils";

// Inside SummaryBuilder component:

const enrichedWordBank = useMemo(() => {
  return enrichWordBankWithReferences(
    content?.word_bank || [],
    correctAnswer?.values || {}
  );
}, [content?.word_bank, correctAnswer?.values]);

const handleRemoveWordFromBank = useCallback((wordItem) => {
  const answers = correctAnswer?.values || {};
  const referencedBlanks = getBlankIdsForWord(wordItem.id, wordItem.value, answers);
  
  if (referencedBlanks.length > 0) {
    const confirmMsg = 
      `⚠️ WARNING: "${wordItem.text}" is currently used in ${referencedBlanks.length} blank(s):\n\n` +
      `Blanks: ${referencedBlanks.join(', ')}\n\n` +
      `Deleting this word will clear those answers. Do you want to continue?`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }
    
    // Clear answers that reference this word
    const updatedAnswers = { ...answers };
    referencedBlanks.forEach(blankId => {
      delete updatedAnswers[blankId];
    });
    
    onAnswerChange({ values: updatedAnswers });
  }
  
  // Remove from word bank
  const updatedBank = (content?.word_bank || []).filter(
    word => word.id !== wordItem.id
  );
  
  onContentChange({
    ...content,
    word_bank: updatedBank
  });
}, [content, correctAnswer, onContentChange, onAnswerChange]);

// In the render:
<div className="space-y-2">
  {enrichedWordBank.map((word) => (
    <div
      key={word.id}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        word.is_referenced 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-slate-50 border border-slate-200'
      }`}
    >
      <span className="flex-1 text-sm">{word.text}</span>
      
      {word.is_referenced && (
        <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
          Used in {word.reference_count} blank{word.reference_count > 1 ? 's' : ''}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => handleRemoveWordFromBank(word)}
        className={`p-1 rounded ${
          word.is_referenced
            ? 'text-amber-600 hover:bg-amber-100'
            : 'text-red-500 hover:bg-red-50'
        }`}
        title={word.is_referenced ? "⚠️ This word is in use" : "Delete word"}
      >
        <X size={14} />
      </button>
    </div>
  ))}
</div>
```

---

## 3. Enhanced Validation

### Update `questionValidation.js`:

```javascript
// utils/questionValidation.js

import { isWordReferenced, getBlankIdsForWord } from "./questionUtils";

const validateShortAnswer = (state) => {
  const isGrouped = state.question_number_end > state.question_number_start;
  
  if (isGrouped) {
    const values = state.correct_answer?.values || {};
    const questionRange = state.question_number_end - state.question_number_start + 1;
    
    let missingAnswers = [];
    for (let i = state.question_number_start; i <= state.question_number_end; i++) {
      const qNum = String(i);
      const answerData = values[qNum];
      
      // Check for enhanced answer format
      if (!answerData) {
        missingAnswers.push(qNum);
        continue;
      }
      
      // Support both old format (string) and new format (object)
      const primary = typeof answerData === 'string' 
        ? answerData 
        : answerData.primary;
      
      if (!primary || String(primary).trim().length === 0) {
        missingAnswers.push(qNum);
      }
    }
    
    if (missingAnswers.length > 0) {
      return `Provide primary answers for Q${missingAnswers.join(', Q')}.`;
    }
  } else {
    // Single question
    const answerData = state.correct_answer;
    const primary = typeof answerData === 'string'
      ? answerData
      : answerData?.primary || answerData?.value;
    
    if (!primary || String(primary).trim().length === 0) {
      return "Provide primary answer for short answer question.";
    }
  }
  
  return null;
};

const validateSummaryDragDrop = (state) => {
  const summaryType = state.content?.summary_type || "story";
  const wordBank = state.content?.word_bank || [];
  const answers = state.correct_answer?.values || {};
  
  // 1. Check word bank exists
  if (wordBank.length === 0) {
    return "Add at least one word to the Word Bank.";
  }
  
  // 2. Get all blank IDs based on summary type
  let blanks = [];
  if (summaryType === "story") {
    blanks = state.content?.blanks || [];
  } else {
    const rows = state.content?.rows || [];
    blanks = rows
      .filter(row => row.type === "question" || !row.type)
      .map(row => row.blank_id || row.id);
  }
  
  if (blanks.length === 0) {
    return summaryType === "story"
      ? "Add at least one blank placeholder (e.g., ___(1)___) in your summary text."
      : "Add at least one question row.";
  }
  
  // 3. Check all blanks have answers
  const unansweredBlanks = blanks.filter(blankId => {
    const answer = answers[blankId];
    if (!answer) return true;
    
    // Support both old format (string) and new format (object)
    const answerValue = typeof answer === 'string'
      ? answer
      : answer.word_value;
    
    return !answerValue || String(answerValue).trim().length === 0;
  });
  
  if (unansweredBlanks.length > 0) {
    return `Select answers for blank(s): ${unansweredBlanks.join(', ')} from the word bank.`;
  }
  
  // 4. CHECK FOR ORPHANED ANSWERS (Critical!)
  const orphanedBlanks = [];
  Object.entries(answers).forEach(([blankId, answer]) => {
    if (!answer) return;
    
    const answerValue = typeof answer === 'string'
      ? answer
      : answer.word_value;
    
    const wordExists = wordBank.some(word => 
      word.value === answerValue || word.id === answer.word_id
    );
    
    if (!wordExists) {
      orphanedBlanks.push(blankId);
    }
  });
  
  if (orphanedBlanks.length > 0) {
    return `⚠️ CRITICAL: Blank(s) ${orphanedBlanks.join(', ')} reference deleted words. ` +
           `Please update these answers or restore the words to the word bank.`;
  }
  
  return null;
};

export const validateState = (state, section) => {
  // ... base validations ...
  
  switch (state.question_type) {
    case "SHORT_ANSWER":
      return validateShortAnswer(state);
    case "SUMMARY_DRAG_DROP":
      return validateSummaryDragDrop(state);
    // ... other types ...
  }
};
```

---

## 4. Backend Integration Examples

### A. API Service for Enhanced Answers:

```javascript
// utils/apiService.js

import { authAxios } from "@/utils/axios";

/**
 * Save question with enhanced answer structure
 */
export const saveQuestionWithEnhancedAnswers = async (questionData) => {
  // Transform frontend state to backend-compatible format
  const payload = {
    ...questionData,
    correct_answer: transformAnswersForBackend(
      questionData.correct_answer,
      questionData.question_type
    )
  };
  
  if (questionData.id) {
    return await authAxios.patch(`/mock-questions/${questionData.id}/`, payload);
  } else {
    return await authAxios.post("/mock-questions/", payload);
  }
};

/**
 * Transform answers from frontend format to backend format
 */
const transformAnswersForBackend = (answers, questionType) => {
  if (questionType === "SHORT_ANSWER") {
    // Check if using enhanced format
    if (answers.values) {
      // Grouped questions
      const transformed = { values: {} };
      Object.entries(answers.values).forEach(([qNum, answerData]) => {
        if (typeof answerData === 'object' && answerData.primary) {
          // Enhanced format - send as-is
          transformed.values[qNum] = answerData;
        } else {
          // Legacy format - wrap in enhanced structure
          transformed.values[qNum] = {
            primary: answerData,
            accepted_variants: [],
            matching_rules: {
              case_sensitive: false,
              trim_whitespace: true,
              allow_punctuation_variance: false
            }
          };
        }
      });
      return transformed;
    } else if (typeof answers === 'object' && answers.primary) {
      // Single question, enhanced format
      return answers;
    } else {
      // Single question, legacy format
      return {
        primary: answers.value || answers,
        accepted_variants: [],
        matching_rules: {
          case_sensitive: false,
          trim_whitespace: true,
          allow_punctuation_variance: false
        }
      };
    }
  }
  
  if (questionType === "SUMMARY_DRAG_DROP") {
    // Ensure word bank has reference flags
    const transformed = { values: {} };
    Object.entries(answers.values || {}).forEach(([blankId, answer]) => {
      if (typeof answer === 'string') {
        // Legacy format - convert to enhanced
        transformed.values[blankId] = {
          word_value: answer,
          word_id: null  // Will be resolved by backend
        };
      } else {
        // Already enhanced format
        transformed.values[blankId] = answer;
      }
    });
    return transformed;
  }
  
  // Other question types - return as-is
  return answers;
};

/**
 * Validate answer on the fly (client-side pre-check)
 */
export const validateStudentAnswer = (studentAnswer, correctAnswer, questionType) => {
  if (questionType === "SHORT_ANSWER") {
    const primary = correctAnswer.primary;
    const variants = correctAnswer.accepted_variants || [];
    const rules = correctAnswer.matching_rules || {};
    
    let normalized = studentAnswer.trim();
    let targetPrimary = primary;
    let targetVariants = variants.map(v => v.value);
    
    if (!rules.case_sensitive) {
      normalized = normalized.toLowerCase();
      targetPrimary = targetPrimary.toLowerCase();
      targetVariants = targetVariants.map(v => v.toLowerCase());
    }
    
    if (rules.allow_punctuation_variance) {
      normalized = normalized.replace(/[-\s]/g, '');
      targetPrimary = targetPrimary.replace(/[-\s]/g, '');
      targetVariants = targetVariants.map(v => v.replace(/[-\s]/g, ''));
    }
    
    // Check primary
    if (normalized === targetPrimary) {
      return { isCorrect: true, score: 100 };
    }
    
    // Check variants
    for (const variant of variants) {
      let variantValue = variant.value;
      if (!rules.case_sensitive) {
        variantValue = variantValue.toLowerCase();
      }
      if (rules.allow_punctuation_variance) {
        variantValue = variantValue.replace(/[-\s]/g, '');
      }
      
      if (normalized === variantValue) {
        return {
          isCorrect: true,
          score: variant.score_percentage || 100
        };
      }
    }
    
    return { isCorrect: false, score: 0 };
  }
  
  // Other question types...
  return { isCorrect: false, score: 0 };
};
```

---

## 5. Testing Examples

### Unit Tests for Enhanced Validation:

```javascript
// utils/__tests__/questionValidation.test.js

import { validateState } from '../questionValidation';

describe('Short Answer Validation - Enhanced', () => {
  test('accepts enhanced answer format with primary', () => {
    const state = {
      question_type: 'SHORT_ANSWER',
      question_number_start: 1,
      question_number_end: 1,
      prompt: 'Test question',
      content: { answer_length_limit: 3 },
      correct_answer: {
        primary: 'bus stop',
        accepted_variants: [
          { value: 'bus-stop', score_percentage: 100 }
        ],
        matching_rules: {
          case_sensitive: false,
          trim_whitespace: true
        }
      }
    };
    
    const result = validateState(state, { id: '123' });
    expect(result).toBeNull();  // No errors
  });
  
  test('rejects empty primary answer', () => {
    const state = {
      question_type: 'SHORT_ANSWER',
      question_number_start: 1,
      question_number_end: 1,
      prompt: 'Test question',
      content: { answer_length_limit: 3 },
      correct_answer: {
        primary: '',
        accepted_variants: []
      }
    };
    
    const result = validateState(state, { id: '123' });
    expect(result).toContain('Provide primary answer');
  });
  
  test('validates grouped questions with enhanced format', () => {
    const state = {
      question_type: 'SHORT_ANSWER',
      question_number_start: 1,
      question_number_end: 3,
      prompt: 'Test questions',
      content: { answer_length_limit: 3 },
      correct_answer: {
        values: {
          '1': { primary: 'answer 1', accepted_variants: [] },
          '2': { primary: 'answer 2', accepted_variants: [] },
          '3': { primary: '', accepted_variants: [] }  // Missing!
        }
      }
    };
    
    const result = validateState(state, { id: '123' });
    expect(result).toContain('Q3');
  });
});

describe('Summary Drag Drop - Orphan Detection', () => {
  test('detects orphaned answers', () => {
    const state = {
      question_type: 'SUMMARY_DRAG_DROP',
      question_number_start: 1,
      question_number_end: 1,
      prompt: 'Test',
      content: {
        summary_type: 'story',
        text: 'Test ___(1)___ text',
        blanks: ['1'],
        word_bank: [
          { id: 'word1', value: 'apple', text: 'apple' }
        ]
      },
      correct_answer: {
        values: {
          '1': { word_id: 'word2', word_value: 'banana' }  // Orphaned!
        }
      }
    };
    
    const result = validateState(state, { id: '123' });
    expect(result).toContain('CRITICAL');
    expect(result).toContain('deleted words');
  });
});
```

---

## 6. Migration Script (Frontend)

```javascript
// utils/migrationHelpers.js

/**
 * Migrate old answer format to new enhanced format
 * Use this when loading legacy questions from backend
 */
export const migrateAnswersToEnhancedFormat = (question) => {
  const { question_type, correct_answer } = question;
  
  if (question_type === 'SHORT_ANSWER') {
    // Check if already enhanced
    if (correct_answer?.primary || correct_answer?.values?.[Object.keys(correct_answer.values)[0]]?.primary) {
      return question;  // Already migrated
    }
    
    // Migrate
    if (correct_answer?.values) {
      // Grouped
      const enhanced = { values: {} };
      Object.entries(correct_answer.values).forEach(([qNum, value]) => {
        enhanced.values[qNum] = {
          primary: value,
          accepted_variants: [],
          matching_rules: {
            case_sensitive: false,
            trim_whitespace: true,
            allow_punctuation_variance: false
          }
        };
      });
      return { ...question, correct_answer: enhanced };
    } else {
      // Single
      return {
        ...question,
        correct_answer: {
          primary: correct_answer?.value || '',
          accepted_variants: [],
          matching_rules: {
            case_sensitive: false,
            trim_whitespace: true,
            allow_punctuation_variance: false
          }
        }
      };
    }
  }
  
  if (question_type === 'SUMMARY_DRAG_DROP') {
    // Check if word bank has reference flags
    const wordBank = question.content?.word_bank || [];
    if (wordBank.length > 0 && wordBank[0].hasOwnProperty('is_referenced')) {
      return question;  // Already migrated
    }
    
    // Add reference flags
    const answers = correct_answer?.values || {};
    const enhancedBank = wordBank.map(word => ({
      ...word,
      is_referenced: Object.values(answers).some(ans => 
        (typeof ans === 'string' ? ans : ans.word_value) === word.value
      ),
      reference_count: Object.values(answers).filter(ans =>
        (typeof ans === 'string' ? ans : ans.word_value) === word.value
      ).length
    }));
    
    return {
      ...question,
      content: {
        ...question.content,
        word_bank: enhancedBank
      }
    };
  }
  
  return question;
};
```

---

## Summary: Implementation Checklist

- [ ] **Phase 1: Answer Variants (2 days)**
  - [ ] Update `questionConfig.js` default answers
  - [ ] Create enhanced `ShortAnswerBuilder.jsx`
  - [ ] Update validation in `questionValidation.js`
  - [ ] Add unit tests

- [ ] **Phase 2: Word Bank Protection (1 day)**
  - [ ] Add helper functions to `questionUtils.js`
  - [ ] Update `SummaryBuilder.jsx` deletion logic
  - [ ] Add visual indicators for referenced words
  - [ ] Add confirmation dialogs

- [ ] **Phase 3: Backend Integration (2 days)**
  - [ ] Create `apiService.js` with transform functions
  - [ ] Update `useQuestionForm.js` to use new service
  - [ ] Add migration helper for legacy data
  - [ ] Test with real API

- [ ] **Phase 4: Testing & QA (1 day)**
  - [ ] Write unit tests
  - [ ] Manual testing of all scenarios
  - [ ] Performance testing with large word banks
  - [ ] Document edge cases

**Total Estimated Time:** 6 days for frontend implementation

---

**Next Steps:** Review with backend team to ensure API compatibility for enhanced answer structures.

