export const MOCK_CATEGORIES = [
  {
    value: "EXAM_TEMPLATE",
    name: "For exams",
  },
  {
    value: "PRACTICE_TEMPLATE",
    name: "For practice",
  },
  {
    value: "CUSTOM",
    name: "Custom",
  },
];

export const MOCK_TEMPLATES = [
  {
    value: "EXAM_TEMPLATE",
    name: "For exams",
  },
  {
    value: "PRACTICE_TEMPLATE",
    name: "For practice",
  },
];

export const TEMPLATE_D_LEVEL = [
  {
    value: "BEGINNER",
    name: "For beginners",
  },
  {
    value: "INTERMEDIATE",
    name: "For intermediate",
  },
  {
    value: "ADVANCED",
    name: "Advanced",
  },
];

export const MOCK_TYPES = [
  {
    value: "LISTENING",
    name: "Listening",
  },
  {
    value: "READING",
    name: "Reading",
  },
  {
    value: "WRITING",
    name: "Writing",
  },
];

export const READING_TYPES = [
  {
    value: "GENERAL",
    name: "Genaral",
  },
  {
    value: "ACADEMIC",
    name: "Academic",
  },
];

export const PARTS_BY_TYPE = {
  LISTENING: 4,
  READING: 3,
  WRITING: 2,
  SPEAKING: 3,
};

export const MOCK_CREATE_STEPS = [
  {
    id: 1,
    label: "Category",
    value: "category",
  },
  {
    id: 2,
    label: "Mock details",
    value: "mock_id",
  },
  {
    id: 3,
    label: "Section create",
    value: "second_id",
  },
  {
    id: 4,
    label: "Questions",
    value: "question",
  },
];

export const MOCK_CATEGORIES_TEXT = {
  EXAM_TEMPLATE: "For exams",
  PRACTICE_TEMPLATE: "For practice",
  CUSTOM: "Custom",
};

export const MOCK_CONFIG = {
  READING: { parts: 3, fields: ["instructions", "images"] },
  WRITING: { parts: 2, fields: ["instructions", "images"] },
  LISTENING: { parts: 4, fields: ["instructions", "images", "audio_file"] },
};

export const QUESTION_TYPES = [
  {
    name: "Multiple Choice",
    value: "MCQ",
    forSections: ["listening", "reading"],
  },
  {
    name: "Matching",
    value: "MATCHING",
    forSections: ["listening"],
  },
  {
    name: "Map/Plan diagram",
    value: "MAP_DIAGRAM",
    forSections: ["listening"],
  },
  {
    name: "Form/Note/Table/Flow-chart",
    value: "COMPLETION",
    forSections: ["listening"],
  },
  {
    name: "Sentence Completion",
    value: "SENTENCE",
    forSections: ["listening", "reading"],
  },
  {
    name: "Short Answer",
    value: "SHORT_ANSWER",
    forSections: ["listening", "reading"],
  },
  {
    name: "Matching Headings",
    value: "MATCH_HEADINGS",
    forSections: ["reading"],
  },
  {
    name: "Matching info",
    value: "MATCH_INFO",
    forSections: ["reading"],
  },
  {
    name: "Matching Features",
    value: "MATCH_FEATURES",
    forSections: ["reading"],
  },
  {
    name: "Matching endings",
    value: "MATCH_ENDINGS",
    forSections: ["reading"],
  },
  {
    name: "True / False / Not Given",
    value: "TFNG",
    forSections: ["reading"],
  },
  {
    name: "Yes / No / Not Given",
    value: "YNNG",
    forSections: ["reading"],
  },
  {
    name: "Summary Completion",
    value: "SUMMARY",
    forSections: ["reading"],
  },
  {
    name: "Note/Table/Flow-chart Completion",
    value: "TABLE_FLOWCHART",
    forSections: ["reading"],
  },
  {
    name: "Diagram Labeling",
    value: "DIAGRAM",
    forSections: ["reading"],
  },
];

export const QUESTION_TYPES_WITH_IMAGE = [
  "DIAGRAM",
  "TABLE_FLOWCHART",
  "MAP_DIAGRAM",
];

// function for question types filter
export function filterQuestionTypes(sectionType) {
  if (!sectionType) return [];

  return QUESTION_TYPES.filter((item) =>
    item.forSections.includes(sectionType.toLowerCase())
  );
}

export function getQuestionTypeName(questionType) {
  if (!questionType) return "";

  const foundType = QUESTION_TYPES.find((item) => item.value === questionType);

  return foundType ? foundType.name : questionType;
}
