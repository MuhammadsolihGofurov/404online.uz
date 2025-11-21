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
