/**
 * Question Type Configuration
 * Contains all question type metadata, default content, and default answers
 */

export const QUESTION_TYPE_CONFIG = {
  MCQ_SINGLE: {
    label: 'Multiple Choice (Single)',
    helper: 'Learner chooses one option.',
  },
  MCQ_MULTIPLE: {
    label: 'Multiple Choice (Multiple)',
    helper: 'Allow two or more correct options.',
  },
  TFNG: {
    label: 'True / False / Not Given',
    helper: 'Select the correct statement.',
  },
  SHORT_ANSWER: {
    label: 'Short Answer',
    helper: 'Text answer with optional text before/after.',
  },
  MATCHING_DRAG_DROP: {
    label: 'Matching – Drag & Drop',
    helper: 'Pair two different lists.',
  },
  MATCHING_TABLE_CLICK: {
    label: 'Matching – Table Click',
    helper: 'Mark applicable columns for each row.',
  },
  SUMMARY_FILL_BLANKS: {
    label: 'Summary – Fill in the Blanks',
    helper: 'Learner types answers into blanks.',
  },
  SUMMARY_DRAG_DROP: {
    label: 'Summary – Drag & Drop',
    helper: 'Drag answers from a word bank.',
  },
  MAP_LABELLING: {
    label: 'Map Labelling',
    helper: 'Assign letters to image regions.',
  },
  FLOWCHART_COMPLETION: {
    label: 'Flowchart Completion',
    helper: 'Complete process steps.',
  },
  TABLE_COMPLETION: {
    label: 'Table Completion',
    helper: 'Fill missing values in a table.',
  },
  ESSAY: {
    label: 'Essay / Writing Task',
    helper: 'Collects long-form responses.',
  },
};

export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const SUMMARY_TYPES = ['SUMMARY_FILL_BLANKS', 'SUMMARY_DRAG_DROP'];

export const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9);

export const defaultContentByType = {
  MCQ_SINGLE: () => ({
    instructions: '',
    options: alphabet.slice(0, 4).map((letter) => ({
      id: createId(),
      value: letter,
      text: '',
    })),
  }),
  MCQ_MULTIPLE: () => ({
    instructions: '',
    options: alphabet.slice(0, 4).map((letter) => ({
      id: createId(),
      value: letter,
      text: '',
    })),
  }),
  MATCHING_DRAG_DROP: () => ({
    list_a: [
      { id: createId(), text: '' },
      { id: createId(), text: '' },
    ],
    list_b: [
      { id: createId(), text: '' },
      { id: createId(), text: '' },
    ],
    list_a_heading: '',
    list_b_heading: '',
  }),
  MATCHING_TABLE_CLICK: () => ({
    columns: ['Option A', 'Option B'],
    rows: [{ id: createId(), label: 'Row 1' }],
  }),
  SHORT_ANSWER: () => ({
    instructions: '',
    answer_length_limit: 3,
    pre_text: '',
    post_text: '',
    variants: [],
  }),
  TFNG: () => ({}),
  SUMMARY_FILL_BLANKS: (questionNumberStart = 1, questionNumberEnd = 1) => {
    const isGrouped = questionNumberEnd > questionNumberStart;
    const items = [];
    const rows = [];

    if (isGrouped) {
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        items.push({
          type: 'question',
          id: String(i),
          pre: '',
          post: '',
          is_bullet: false,
        });
        rows.push({
          type: 'question',
          id: String(i),
          pre_text: '',
          blank_id: String(i),
          post_text: '',
        });
      }
    } else {
      items.push({
        type: 'question',
        id: String(questionNumberStart),
        pre: '',
        post: '',
        is_bullet: false,
      });
      rows.push({
        type: 'question',
        id: String(questionNumberStart),
        pre_text: '',
        blank_id: String(questionNumberStart),
        post_text: '',
      });
    }

    return {
      summary_type: 'story',
      items,
      rows,
      text: '',
      blanks: [],
      word_limit: 3,
    };
  },
  SUMMARY_DRAG_DROP: () => ({
    summary_type: 'story',
    text: '',
    blanks: [],
    items: [],
    rows: [],
    word_bank: [],
    word_limit: 3,
  }),
  MAP_LABELLING: () => ({
    map_image_url: '',
    instructions: '',
    regions: [
      { id: createId(), label: 'Region 1', coordinates: { x: 0, y: 0 } },
    ],
  }),
  FLOWCHART_COMPLETION: () => ({
    steps: [
      { id: createId(), text: '', blank_id: '' },
      { id: createId(), text: '', blank_id: '' },
    ],
    allowed_words: '',
  }),
  TABLE_COMPLETION: () => ({
    columns: ['Column 1', 'Column 2'],
    rows: [{ id: createId(), label: 'Row 1', cells: ['', ''] }],
  }),
  ESSAY: (_start, _end, section) => ({
    min_word_count: section?.part_number === 1 ? 150 : 250,
  }),
};

export const defaultAnswerByType = {
  MCQ_SINGLE: (questionNumberStart = 1, questionNumberEnd = 1) => {
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = '';
      }
      return { values };
    }
    return { value: '' };
  },
  MCQ_MULTIPLE: () => ({ values: [] }),
  MATCHING_DRAG_DROP: () => ({ pairs: [] }),
  MATCHING_TABLE_CLICK: () => ({ selections: {} }),
  SHORT_ANSWER: (questionNumberStart = 1, questionNumberEnd = 1) => {
    // New enhanced format with answer variants support
    const singleAnswer = {
      primary: '',
      alternatives: [],
      is_case_sensitive: false,
    };

    if (questionNumberEnd > questionNumberStart) {
      // Grouped questions (Q1-Q5)
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = { ...singleAnswer };
      }
      return { values };
    }

    // Single question
    return singleAnswer;
  },
  TFNG: (questionNumberStart = 1, questionNumberEnd = 1) => {
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = '';
      }
      return { values };
    }
    return { value: '' };
  },
  SUMMARY_FILL_BLANKS: () => ({ values: {} }),
  SUMMARY_DRAG_DROP: () => ({ values: {} }),
  MAP_LABELLING: () => ({ labels: {} }),
  FLOWCHART_COMPLETION: () => ({ values: {} }),
  TABLE_COMPLETION: () => ({ values: {} }),
  ESSAY: () => ({ text: '' }),
};
