/**
 * Question Utility Functions
 * Pure functions for question state management and validation
 */

import { SUMMARY_TYPES, defaultContentByType, defaultAnswerByType } from "./questionConfig";

// Helper: Normalize word bank items
export const normalizeWordBankItems = (wordBank = []) =>
  (wordBank || []).map((word, idx) => {
    if (typeof word === "string") {
      return {
        id: `word-${idx}`,
        text: word,
        value: word,
        originalIndex: idx,
      };
    }

    if (word && typeof word === "object") {
      return {
        id: word.id || `word-${idx}`,
        text: word.text || word.value || String(word),
        value: word.value || word.id || word.text || String(word),
        originalIndex: idx,
      };
    }

    const fallback = String(word);
    return {
      id: `word-${idx}`,
      text: fallback,
      value: fallback,
      originalIndex: idx,
    };
  });

// Helper: Check if word bank contains value
export const wordBankContainsValue = (wordBank = [], value) => {
  if (!value && value !== 0) return false;
  const normalizedValue = String(value).trim();
  if (!normalizedValue) return false;

  return normalizeWordBankItems(wordBank).some((item) => {
    const candidates = [item.value, item.id, item.text]
      .filter(Boolean)
      .map((candidate) => String(candidate).trim());
    return candidates.includes(normalizedValue);
  });
};

// Helper: Check if range is grouped
export const isGroupedRange = (start, end) => end > start;

// Helper: Get section mock type
export const getSectionMockType = (section) =>
  section?.mock?.mock_type || section?.mock_type;

// Helper: Check if writing section
export const isWritingSection = (section) =>
  getSectionMockType(section) === "WRITING";

// Helper: Get essay default min word count
export const getEssayDefaultMinWordCount = (section) =>
  section?.part_number === 1 ? 150 : 250;

// Helper: Get next question number
export const getNextQuestionNumber = (section) => {
  if (!section?.questions?.length) return 1;
  const max = Math.max(
    ...section.questions.map((q) => q.question_number_end || 0)
  );
  return max + 1;
};

// Ensure statements for grouped questions
const ensureStatements = (questionType, content, start, end) => {
  const needsStatements = ["TFNG", "MCQ_SINGLE"].includes(questionType);
  const isGrouped = isGroupedRange(start, end);

  if (!needsStatements || !isGrouped) {
    return content;
  }

  const requiredCount = end - start + 1;
  const currentStatements = content?.statements || [];

  if (currentStatements.length === requiredCount) {
    return content;
  }

  const newStatements = [];
  for (let i = 0; i < requiredCount; i++) {
    newStatements.push(currentStatements[i] || "");
  }

  return { ...content, statements: newStatements };
};

// Ensure summary content structure
const ensureSummaryContent = (content = {}, start, end) => {
  const summaryType = content.summary_type || "story";
  const isGrouped = isGroupedRange(start, end);

  const nextContent = {
    ...content,
    summary_type: summaryType,
    blanks: content.blanks || [],
    items: content.items || [],
    rows: content.rows || [],
    text: content.text || "",
    word_limit: content.word_limit || 3,
  };

  if (summaryType === "story") {
    // Story mode - ensure items array
    if (!nextContent.items || nextContent.items.length === 0) {
      const items = [];
      if (isGrouped) {
        for (let i = start; i <= end; i++) {
          items.push({
            type: "question",
            id: String(i),
            pre: "",
            post: "",
            is_bullet: false,
          });
        }
      } else {
        items.push({
          type: "question",
          id: String(start),
          pre: "",
          post: "",
          is_bullet: false,
        });
      }
      nextContent.items = items;
    }
  } else {
    // Bullet/Numbered mode - ensure rows array
    if (!nextContent.rows || nextContent.rows.length === 0) {
      const rows = [];
      if (isGrouped) {
        for (let i = start; i <= end; i++) {
          rows.push({
            type: "question",
            id: String(i),
            pre_text: "",
            blank_id: String(i),
            post_text: "",
          });
        }
      } else {
        rows.push({
          type: "question",
          id: String(start),
          pre_text: "",
          blank_id: String(start),
          post_text: "",
        });
      }
      nextContent.rows = rows;
    }
  }

  return nextContent;
};

// Ensure essay content
const ensureEssayContent = (content = {}, section) => {
  const min_word_count =
    content?.min_word_count ?? getEssayDefaultMinWordCount(section);
  return { ...content, min_word_count };
};

// Ensure content structure based on question type
export const ensureContentStructure = (
  questionType,
  content,
  start,
  end,
  section
) => {
  if (SUMMARY_TYPES.includes(questionType)) {
    return ensureSummaryContent(content, start, end);
  }

  if (questionType === "ESSAY") {
    return ensureEssayContent(content, section);
  }

  const baseContent =
    content && Object.keys(content).length
      ? content
      : defaultContentByType[questionType]?.(start, end, section) || {};

  return ensureStatements(questionType, baseContent, start, end);
};

// Ensure grouped answer shape
const ensureGroupedAnswerShape = (answer, start, end) => {
  const values = { ...(answer?.values || {}) };
  for (let i = start; i <= end; i++) {
    const key = String(i);
    if (!(key in values)) {
      values[key] = "";
    }
  }
  Object.keys(values).forEach((key) => {
    const num = Number(key);
    if (num < start || num > end) {
      delete values[key];
    }
  });
  return { values };
};

// Ensure summary answers
const ensureSummaryAnswers = (answer, content) => {
  const blanks = content?.blanks || [];
  const nextValues = { ...(answer?.values || {}) };
  blanks.forEach((blankId) => {
    if (!(blankId in nextValues)) {
      nextValues[blankId] = "";
    }
  });
  Object.keys(nextValues).forEach((key) => {
    if (!blanks.includes(key)) {
      delete nextValues[key];
    }
  });
  return { values: nextValues };
};

// Ensure answer structure based on question type
export const ensureAnswerStructure = (
  questionType,
  answer,
  start,
  end,
  content,
  section
) => {
  const baseAnswer =
    answer && Object.keys(answer).length
      ? answer
      : defaultAnswerByType[questionType]?.(start, end, section) || {};

  if (SUMMARY_TYPES.includes(questionType)) {
    return ensureSummaryAnswers(baseAnswer, content);
  }

  if (["MCQ_SINGLE", "TFNG", "SHORT_ANSWER"].includes(questionType)) {
    if (isGroupedRange(start, end)) {
      return ensureGroupedAnswerShape(baseAnswer, start, end);
    }
    return { value: baseAnswer.value || "" };
  }

  if (questionType === "MCQ_MULTIPLE") {
    return { values: Array.isArray(baseAnswer.values) ? baseAnswer.values : [] };
  }

  if (questionType === "MATCHING_DRAG_DROP") {
    return { pairs: Array.isArray(baseAnswer.pairs) ? baseAnswer.pairs : [] };
  }

  if (questionType === "MATCHING_TABLE_CLICK" || questionType === "TABLE_COMPLETION") {
    return { values: baseAnswer.values || {} };
  }

  if (questionType === "MAP_LABELLING") {
    return { labels: baseAnswer.labels || {} };
  }

  if (questionType === "FLOWCHART_COMPLETION") {
    return { values: baseAnswer.values || {} };
  }

  if (questionType === "ESSAY") {
    return { text: baseAnswer.text || "" };
  }

  return baseAnswer;
};

// Sanitize state to ensure all constraints are met
export const sanitizeState = (state, meta = {}) => {
  const section = meta.section;
  const writingMode = isWritingSection(section) || state.question_type === "ESSAY";
  const nextState = {
    ...state,
    question_number_start: Number(state.question_number_start) || 1,
    question_number_end: Number(state.question_number_end) || Number(state.question_number_start) || 1,
  };

  if (writingMode) {
    nextState.question_type = "ESSAY";
    nextState.question_number_end = nextState.question_number_start;
  } else if (nextState.question_number_end < nextState.question_number_start) {
    nextState.question_number_end = nextState.question_number_start;
  }

  nextState.content = ensureContentStructure(
    nextState.question_type,
    nextState.content,
    nextState.question_number_start,
    nextState.question_number_end,
    section
  );

  nextState.correct_answer = ensureAnswerStructure(
    nextState.question_type,
    nextState.correct_answer,
    nextState.question_number_start,
    nextState.question_number_end,
    nextState.content,
    section
  );

  return nextState;
};

// Build initial state from question and section
export const buildInitialState = (question, section) => {
  const mockType = getSectionMockType(section);
  const isWritingMock = mockType === "WRITING";
  const baseType = isWritingMock ? "ESSAY" : question?.question_type || "MCQ_SINGLE";
  const nextNumber = getNextQuestionNumber(section);
  const questionNumberStart = question?.question_number_start || nextNumber || 1;
  const questionNumberEnd = isWritingMock
    ? questionNumberStart
    : (question?.question_number_end || nextNumber || 1);

  const content = question?.content ||
    (defaultContentByType[baseType]
      ? defaultContentByType[baseType](questionNumberStart, questionNumberEnd, section)
      : {});

  const correct_answer = question?.correct_answer ||
    (defaultAnswerByType[baseType]
      ? defaultAnswerByType[baseType](questionNumberStart, questionNumberEnd, section)
      : {});

  return {
    question_type: baseType,
    question_number_start: questionNumberStart,
    question_number_end: questionNumberEnd,
    prompt: question?.prompt || "",
    content: ensureContentStructure(baseType, content, questionNumberStart, questionNumberEnd, section),
    correct_answer: ensureAnswerStructure(baseType, correct_answer, questionNumberStart, questionNumberEnd, content, section),
  };
};

