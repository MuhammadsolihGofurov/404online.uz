/**
 * Question Validation Logic
 * Modular validation functions for each question type
 */

import { SUMMARY_TYPES } from "./questionConfig";
import { wordBankContainsValue } from "./questionUtils";

// Validate MCQ questions
const validateMCQ = (state) => {
  const isGrouped = state.question_number_end > state.question_number_start;
  const useSameOptions = state.content?.use_same_options !== false;

  if (isGrouped && !useSameOptions) {
    // Independent Options Mode
    const questions = state.content?.questions || [];
    const questionRange = [];
    for (let i = state.question_number_start; i <= state.question_number_end; i++) {
      questionRange.push(String(i));
    }

    if (questions.length === 0) {
      return "Add questions for independent options mode.";
    }

    for (const qNum of questionRange) {
      const question = questions.find(q => q.id === qNum);
      if (!question) {
        return `Question Q${qNum} is missing in independent options mode.`;
      }

      const questionOptions = question.options || [];
      if (questionOptions.length < 2) {
        return `Q${qNum}: Provide at least two options.`;
      }
      if (questionOptions.some((opt) => !opt.text?.trim())) {
        return `Q${qNum}: All options must have text.`;
      }

      const values = state.correct_answer?.values || {};
      const answer = values[qNum];
      if (!answer || String(answer).trim().length === 0) {
        return `Q${qNum}: Select the correct answer.`;
      }
    }
  } else {
    // Same Options Mode
    const options = state.content?.options || [];
    if (options.length < 2 || options.some((opt) => !opt.text?.trim())) {
      return "Provide at least two MCQ options with text.";
    }

    if (state.question_type === "MCQ_SINGLE") {
      if (isGrouped) {
        const statements = state.content?.statements || [];
        const requiredCount = state.question_number_end - state.question_number_start + 1;

        if (!statements || statements.length !== requiredCount) {
          return `Please enter statements for all ${requiredCount} sub-questions.`;
        }

        const emptyStatements = statements.filter((stmt) => !stmt || !String(stmt).trim()).length;
        if (emptyStatements > 0) {
          return `Please enter statements for all sub-questions. ${emptyStatements} statement${emptyStatements > 1 ? 's are' : ' is'} empty.`;
        }

        const values = state.correct_answer?.values || {};
        for (let i = state.question_number_start; i <= state.question_number_end; i++) {
          const key = String(i);
          const answer = values[key];
          if (!answer || String(answer).trim().length === 0) {
            return `Select correct answer for Q${i}.`;
          }
        }
      } else {
        if (!state.correct_answer?.value) {
          return "Select the correct MCQ option.";
        }
      }
    }
  }

  if (
    state.question_type === "MCQ_MULTIPLE" &&
    !(state.correct_answer?.values || []).length
  ) {
    return "Select the correct MCQ options.";
  }

  return null;
};

// Validate TFNG questions
const validateTFNG = (state) => {
  const isGrouped = state.question_number_end > state.question_number_start;
  if (isGrouped) {
    const statements = state.content?.statements || [];
    const requiredCount = state.question_number_end - state.question_number_start + 1;

    if (!statements || statements.length !== requiredCount) {
      return `Please enter statements for all ${requiredCount} sub-questions.`;
    }

    const emptyStatements = statements.filter((stmt) => !stmt || !String(stmt).trim()).length;
    if (emptyStatements > 0) {
      return `Please enter statements for all sub-questions. ${emptyStatements} statement${emptyStatements > 1 ? 's are' : ' is'} empty.`;
    }

    const values = state.correct_answer?.values || {};
    const questionRange = state.question_number_end - state.question_number_start + 1;
    const answeredCount = Object.keys(values).filter(
      (key) => values[key] && String(values[key]).trim().length > 0
    ).length;
    if (answeredCount !== questionRange) {
      return `Select answers (True/False/Not Given) for all ${questionRange} sub-questions.`;
    }
  } else {
    if (!state.correct_answer?.value) {
      return "Select T, F, or NG.";
    }
  }
  return null;
};

// Validate Short Answer questions
const validateShortAnswer = (state) => {
  const isGrouped = state.question_number_end > state.question_number_start;
  
  if (isGrouped) {
    // Validate grouped questions (Q1-Q5)
    const values = state.correct_answer?.values || {};
    const questionRange = state.question_number_end - state.question_number_start + 1;
    
    let missingAnswers = [];
    for (let i = state.question_number_start; i <= state.question_number_end; i++) {
      const qNum = String(i);
      const answerData = values[qNum];
      
      // Support both old format (string) and new format (object with primary)
      let primary;
      if (!answerData) {
        missingAnswers.push(qNum);
        continue;
      } else if (typeof answerData === 'string') {
        primary = answerData;
      } else {
        primary = answerData.primary;
      }
      
      if (!primary || String(primary).trim().length === 0) {
        missingAnswers.push(qNum);
      }
    }
    
    if (missingAnswers.length > 0) {
      return `Provide primary answers for Q${missingAnswers.join(', Q')}.`;
    }
  } else {
    // Validate single question
    const answerData = state.correct_answer;
    
    // Support both old format (value) and new format (primary)
    const primary = answerData?.primary || answerData?.value;
    
    if (!primary || String(primary).trim().length === 0) {
      return "Provide primary answer for short answer question.";
    }
  }
  
  return null;
};

// Validate Summary questions
const validateSummary = (state) => {
  const isDragDropSummary = state.question_type === "SUMMARY_DRAG_DROP";
  const summaryType = state.content?.summary_type || "story";

  // Helper to safely extract blank ID (handles object vs string)
  const getBlankId = (blank) => {
    if (typeof blank === 'object' && blank !== null) {
      return String(blank.id || blank.value || blank.text || blank.label || '');
    }
    return String(blank);
  };

  if (summaryType === "story") {
    const text = state.content?.text || "";
    if (!text.trim()) {
      return "Enter summary text in Story mode.";
    }

    const blanks = state.content?.blanks || [];
    if (blanks.length === 0) {
      return "Add at least one blank placeholder (e.g., ___(6)___) in your summary text.";
    }

    const answers = state.correct_answer?.values || {};
    const unansweredBlanks = blanks.filter((blank) => {
      const blankId = getBlankId(blank);
      const value = answers[blankId];
      if (isDragDropSummary) {
        return (
          !value ||
          !wordBankContainsValue(state.content?.word_bank || [], value)
        );
      }
      return !value || String(value).trim().length === 0;
    });
    
    if (unansweredBlanks.length > 0) {
      if (isDragDropSummary) {
        return `Select answers for all ${blanks.length} blank${blanks.length > 1 ? 's' : ''} from the word bank.`;
      }
      return `Fill correct answers for all ${blanks.length} blank${blanks.length > 1 ? 's' : ''}.`;
    }
  } else {
    const rows = state.content?.rows || [];
    const questionRows = rows.filter(row => row.type === "question" || !row.type);
    if (questionRows.length === 0) {
      return "Add at least one question row.";
    }

    const answers = state.correct_answer?.values || {};
    const unansweredRows = questionRows.filter((row) => {
      const blankId = row.blank_id || row.id;
      const value = answers[blankId];
      if (isDragDropSummary) {
        return (
          !value ||
          !wordBankContainsValue(state.content?.word_bank || [], value)
        );
      }
      return !value || String(value).trim().length === 0;
    });
    if (unansweredRows.length > 0) {
      if (isDragDropSummary) {
        return `Select answers for all ${questionRows.length} row${questionRows.length > 1 ? 's' : ''} from the word bank.`;
      }
      return `Fill correct answers for all ${questionRows.length} question row${questionRows.length > 1 ? 's' : ''}.`;
    }
  }

  if (isDragDropSummary) {
    const wordBank = state.content?.word_bank || [];
    if (!wordBank.length) {
      return "Add at least one word to the Word Bank.";
    }
  }

  return null;
};

// Validate other question types
const validateMatching = (state) => {
  const pairs = state.correct_answer?.pairs || [];
  if (!pairs.length) {
    return "Map at least one pair for matching questions.";
  }
  return null;
};

const validateMapLabelling = (state) => {
  if (!state.content?.map_image_url) {
    return "Provide map image URL.";
  }
  return null;
};

const validateEssay = (state) => {
  const minWord = Number(state.content?.min_word_count);
  if (!minWord || minWord <= 0) {
    return "Set a minimum word count for the essay.";
  }
  return null;
};

// Main validation function
export const validateState = (state, section) => {
  if (!section?.id) {
    return "Select a section before saving.";
  }
  if (!state.prompt?.trim()) {
    return "Prompt cannot be empty.";
  }
  if (!state.question_type) {
    return "Choose a question type.";
  }
  if (!state.question_number_start || !state.question_number_end) {
    return "Question numbers are required.";
  }
  if (Number(state.question_number_end) < Number(state.question_number_start)) {
    return "Question range is invalid.";
  }

  // Type-specific validation
  if (state.question_type.startsWith("MCQ")) {
    return validateMCQ(state);
  }

  if (state.question_type === "TFNG") {
    return validateTFNG(state);
  }

  if (state.question_type === "SHORT_ANSWER") {
    return validateShortAnswer(state);
  }

  if (SUMMARY_TYPES.includes(state.question_type)) {
    return validateSummary(state);
  }

  if (state.question_type === "MATCHING_DRAG_DROP") {
    return validateMatching(state);
  }

  if (state.question_type === "MAP_LABELLING") {
    return validateMapLabelling(state);
  }

  if (state.question_type === "ESSAY") {
    return validateEssay(state);
  }

  return null;
};

