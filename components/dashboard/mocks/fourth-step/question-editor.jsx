import React, { useEffect, useMemo, useReducer, useRef } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { authAxios } from "@/utils/axios";
import {
  McqBuilder,
  MatchingBuilder,
  ShortAnswerBuilder,
  TableBuilder,
} from "../questions";
import {
  X,
  Save,
  Eye,
  Loader2,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
  ),
});

const QUESTION_TYPE_CONFIG = {
  MCQ_SINGLE: {
    label: "Multiple Choice (Single)",
    helper: "Learner chooses one option.",
  },
  MCQ_MULTIPLE: {
    label: "Multiple Choice (Multiple)",
    helper: "Allow two or more correct options.",
  },
  TFNG: {
    label: "True / False / Not Given",
    helper: "Select the correct statement.",
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    helper: "Text answer with optional text before/after.",
  },
  MATCHING_DRAG_DROP: {
    label: "Matching – Drag & Drop",
    helper: "Pair two different lists.",
  },
  MATCHING_TABLE_CLICK: {
    label: "Matching – Table Click",
    helper: "Mark applicable columns for each row.",
  },
  SUMMARY_FILL_BLANKS: {
    label: "Summary – Fill in the Blanks",
    helper: "Learner types answers into blanks.",
  },
  SUMMARY_DRAG_DROP: {
    label: "Summary – Drag & Drop",
    helper: "Drag answers from a word bank.",
  },
  MAP_LABELLING: {
    label: "Map Labelling",
    helper: "Assign letters to image regions.",
  },
  FLOWCHART_COMPLETION: {
    label: "Flowchart Completion",
    helper: "Complete process steps.",
  },
  TABLE_COMPLETION: {
    label: "Table Completion",
    helper: "Fill missing values in a table.",
  },
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9);

const defaultContentByType = {
  MCQ_SINGLE: () => ({
    instructions: "",
    options: alphabet.slice(0, 4).map((letter) => ({
      id: createId(),
      value: letter,
      text: "",
    })),
  }),
  MCQ_MULTIPLE: () => ({
    instructions: "",
    options: alphabet.slice(0, 4).map((letter) => ({
      id: createId(),
      value: letter,
      text: "",
    })),
  }),
  MATCHING_DRAG_DROP: () => ({
    list_a: [
      { id: createId(), text: "" },
      { id: createId(), text: "" },
    ],
    list_b: [
      { id: createId(), text: "" },
      { id: createId(), text: "" },
    ],
  }),
  MATCHING_TABLE_CLICK: () => ({
    columns: ["Option A", "Option B"],
    rows: [{ id: createId(), label: "Row 1" }],
  }),
  SHORT_ANSWER: () => ({
    instructions: "",
    answer_length_limit: 3,
    pre_text: "",
    post_text: "",
    variants: [],
  }),
  TFNG: () => ({}),
  SUMMARY_FILL_BLANKS: (questionNumberStart = 1, questionNumberEnd = 1) => {
    const isGrouped = questionNumberEnd > questionNumberStart;
    const items = [];
    const rows = [];
    
    if (isGrouped) {
      // Generate question rows for each question number
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        items.push({
          type: "question",
          id: String(i),
          pre: "",
          post: "",
          is_bullet: false,
        });
        rows.push({
          type: "question",
          id: String(i),
          pre_text: "",
          blank_id: String(i),
          post_text: "",
        });
      }
    } else {
      // Single question - one row
      items.push({
        type: "question",
        id: String(questionNumberStart),
        pre: "",
        post: "",
        is_bullet: false,
      });
      rows.push({
        type: "question",
        id: String(questionNumberStart),
        pre_text: "",
        blank_id: String(questionNumberStart),
        post_text: "",
      });
    }
    
    return {
      summary_type: "story", // Default to story mode
      items,
      rows,
      text: "", // For story mode (Rich Text)
      blanks: [], // Auto-synced from text placeholders
      word_limit: 3,
    };
  },
  SUMMARY_DRAG_DROP: () => ({
    text: "",
    blanks: ["A", "B"],
    word_bank: [],
  }),
  MAP_LABELLING: () => ({
    map_image_url: "",
    instructions: "",
    regions: [
      { id: createId(), label: "Region 1", coordinates: { x: 0, y: 0 } },
    ],
  }),
  FLOWCHART_COMPLETION: () => ({
    steps: [
      { id: createId(), text: "", blank_id: "" },
      { id: createId(), text: "", blank_id: "" },
    ],
    allowed_words: "",
  }),
  TABLE_COMPLETION: () => ({
    columns: ["Column 1", "Column 2"],
    rows: [{ id: createId(), label: "Row 1", cells: ["", ""] }],
  }),
};

const defaultAnswerByType = {
  MCQ_SINGLE: (questionNumberStart = 1, questionNumberEnd = 1) => {
    // For grouped questions, use nested values structure
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = "";
      }
      return { values };
    }
    return { value: "" };
  },
  MCQ_MULTIPLE: () => ({ values: [] }),
  MATCHING_DRAG_DROP: () => ({ pairs: [] }),
  MATCHING_TABLE_CLICK: () => ({ selections: {} }),
  SHORT_ANSWER: (questionNumberStart = 1, questionNumberEnd = 1) => {
    // For grouped questions, use nested values structure
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = "";
      }
      return { values };
    }
    return { value: "" };
  },
  TFNG: (questionNumberStart = 1, questionNumberEnd = 1) => {
    // For grouped questions, use nested values structure
    if (questionNumberEnd > questionNumberStart) {
      const values = {};
      for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
        values[String(i)] = "";
      }
      return { values };
    }
    return { value: "" };
  },
  SUMMARY_FILL_BLANKS: () => ({ values: {} }),
  SUMMARY_DRAG_DROP: () => ({ values: {} }),
  MAP_LABELLING: () => ({ labels: {} }),
  FLOWCHART_COMPLETION: () => ({ values: {} }),
  TABLE_COMPLETION: () => ({ values: {} }),
};

const initialState = {
  question_type: "MCQ_SINGLE",
  question_number_start: 1,
  question_number_end: 1,
  prompt: "",
  content: defaultContentByType.MCQ_SINGLE(),
  correct_answer: defaultAnswerByType.MCQ_SINGLE(),
};

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...state, ...action.payload };
    case "PATCH":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

function getNextQuestionNumber(section) {
  if (!section?.questions?.length) return 1;
  const max = Math.max(
    ...section.questions.map((q) => q.question_number_end || 0)
  );
  return max + 1;
}

function buildInitialState(question, section) {
  const baseType = question?.question_type || "MCQ_SINGLE";
  const nextNumber = getNextQuestionNumber(section);
  const questionNumberStart = question?.question_number_start || nextNumber || 1;
  const questionNumberEnd = question?.question_number_end || nextNumber || 1;
  
  // For SUMMARY_FILL_BLANKS, ensure proper structure with summary_type
  let content = question?.content || {};
  if (baseType === "SUMMARY_FILL_BLANKS") {
    // Ensure summary_type is always set (default to "story")
    if (!content.summary_type) {
      content.summary_type = "story";
    }
    
    // Ensure blanks array exists for story mode
    if (!content.blanks) {
      content.blanks = [];
    }
    
    if (!content.items || content.items.length === 0) {
      // Migrate from old format (text + blanks) to new format (items array)
      if (content.text) {
        // Legacy format - convert to items
        const items = [];
        const isGrouped = questionNumberEnd > questionNumberStart;
        if (isGrouped) {
          for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
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
            id: String(questionNumberStart),
            pre: "",
            post: "",
            is_bullet: false,
          });
        }
        content = { ...content, items };
      } else {
        // New question - use default
        content = defaultContentByType[baseType]
          ? defaultContentByType[baseType](questionNumberStart, questionNumberEnd)
          : {};
      }
    }
    
    // Ensure rows array exists for bullet/numbered modes
    if (!content.rows) {
      content.rows = [];
    }
  } else {
    // For other types, use default or existing content
    content = question?.content ||
      (defaultContentByType[baseType]
        ? defaultContentByType[baseType]()
        : {});
  }
  
  return {
    question_type: baseType,
    question_number_start: questionNumberStart,
    question_number_end: questionNumberEnd,
    prompt: question?.prompt || "",
    content,
    correct_answer:
      question?.correct_answer ||
      (defaultAnswerByType[baseType]
        ? defaultAnswerByType[baseType](questionNumberStart, questionNumberEnd)
        : {}),
  };
}

function LivePreview({ state, section }) {
  return (
    <div className="p-5 space-y-4 border rounded-3xl border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Eye size={16} />
        Student preview
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Section
        </p>
        <p className="text-lg font-semibold text-slate-800">
          Part {section?.part_number}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Question
        </p>
        <p className="text-base font-medium text-slate-800">
          Q{state.question_number_start}
          {state.question_number_end > state.question_number_start
            ? ` - ${state.question_number_end}`
            : ""}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Prompt
        </p>
        <div
          className="prose-sm prose max-w-none text-slate-700"
          dangerouslySetInnerHTML={{
            __html: state.prompt || "<p>No prompt yet.</p>",
          }}
        />
      </div>
      <div className="p-4 text-xs bg-white border border-dashed rounded-2xl border-slate-200 text-slate-500">
        Preview is illustrative. Exact layout will adapt to student player.
      </div>
    </div>
  );
}

function WarningBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 p-3 text-sm border rounded-2xl border-amber-200 bg-amber-50 text-amber-700">
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}

export default function QuestionEditor({
  isOpen,
  section,
  question,
  onClose,
  onSuccess,
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // ReactQuill ref for Summary Fill Blanks editor (must be at top level)
  const quillRef = useRef(null);

  useEffect(() => {
    if (section) {
      dispatch({ type: "RESET", payload: buildInitialState(question, section) });
    }
  }, [section?.id, question?.id]);

  // Handle question range changes - update correct_answer structure
  useEffect(() => {
    const isGrouped = state.question_number_end > state.question_number_start;
    const questionTypesNeedingGroupedSupport = ["MCQ_SINGLE", "TFNG", "SHORT_ANSWER"];
    
    if (questionTypesNeedingGroupedSupport.includes(state.question_type)) {
      if (isGrouped) {
        // Convert single answer to grouped structure if needed
        if (state.correct_answer?.value && !state.correct_answer?.values) {
          const values = {};
          for (let i = state.question_number_start; i <= state.question_number_end; i++) {
            values[String(i)] = state.correct_answer.value;
          }
          dispatch({
            type: "PATCH",
            payload: { correct_answer: { values } },
          });
        } else if (state.correct_answer?.values) {
          // Ensure all question numbers in range have entries
          const values = { ...state.correct_answer.values };
          let updated = false;
          for (let i = state.question_number_start; i <= state.question_number_end; i++) {
            if (!(String(i) in values)) {
              values[String(i)] = "";
              updated = true;
            }
          }
          // Remove entries outside the range
          Object.keys(values).forEach((key) => {
            const num = Number(key);
            if (num < state.question_number_start || num > state.question_number_end) {
              delete values[key];
              updated = true;
            }
          });
          if (updated) {
            dispatch({
              type: "PATCH",
              payload: { correct_answer: { values } },
            });
          }
        }
      } else {
        // Convert grouped answer to single structure if needed
        if (state.correct_answer?.values && !state.correct_answer?.value) {
          // Use the first value or empty string
          const firstValue = Object.values(state.correct_answer.values)[0] || "";
          dispatch({
            type: "PATCH",
            payload: { correct_answer: { value: firstValue } },
          });
        }
      }
    }
  }, [state.question_number_start, state.question_number_end, state.question_type]);

  // Handle question range changes for SUMMARY_FILL_BLANKS - auto-generate/update question rows
  useEffect(() => {
    if (state.question_type === "SUMMARY_FILL_BLANKS") {
      const summaryType = state.content?.summary_type || "story";
      
      if (summaryType === "story") {
        // Story mode: sync items array
        if (state.content?.items && state.content.items.length > 0) {
          const items = state.content.items;
          const questionItems = items.filter(item => item.type === "question");
          const nonQuestionItems = items.filter(item => item.type !== "question");
          
          // Get expected question IDs based on range
          const expectedQuestionIds = [];
          for (let i = state.question_number_start; i <= state.question_number_end; i++) {
            expectedQuestionIds.push(String(i));
          }
          
          // Get current question IDs
          const currentQuestionIds = questionItems.map(item => item.id);
          
          // Check if we need to update
          const needsUpdate = 
            expectedQuestionIds.length !== currentQuestionIds.length ||
            !expectedQuestionIds.every(id => currentQuestionIds.includes(id)) ||
            currentQuestionIds.some(id => !expectedQuestionIds.includes(id));
          
          if (needsUpdate) {
            // Preserve existing question data
            const questionDataMap = {};
            questionItems.forEach(item => {
              questionDataMap[item.id] = item;
            });
            
            // Create new question items for the range
            const newQuestionItems = expectedQuestionIds.map(id => {
              if (questionDataMap[id]) {
                return questionDataMap[id];
              } else {
                return {
                  type: "question",
                  id: id,
                  pre: "",
                  post: "",
                  is_bullet: false,
                };
              }
            });
            
            const newItems = [...newQuestionItems, ...nonQuestionItems];
            
            dispatch({
              type: "PATCH",
              payload: { 
                content: { 
                  ...state.content, 
                  items: newItems 
                } 
              },
            });
            
            // Update correct_answer structure
            const answers = state.correct_answer?.values || {};
            const newAnswers = { ...answers };
            let answersUpdated = false;
            
            expectedQuestionIds.forEach(id => {
              if (!(id in newAnswers)) {
                newAnswers[id] = "";
                answersUpdated = true;
              }
            });
            
            Object.keys(newAnswers).forEach(key => {
              const num = Number(key);
              if (num < state.question_number_start || num > state.question_number_end) {
                delete newAnswers[key];
                answersUpdated = true;
              }
            });
            
            if (answersUpdated) {
              dispatch({
                type: "PATCH",
                payload: { correct_answer: { values: newAnswers } },
              });
            }
          }
        }
      } else {
        // Bullet/Numbered mode: sync rows array
        if (state.content?.rows && state.content.rows.length > 0) {
          const rows = state.content.rows;
          
          // Get expected question IDs based on range
          const expectedQuestionIds = [];
          for (let i = state.question_number_start; i <= state.question_number_end; i++) {
            expectedQuestionIds.push(String(i));
          }
          
          // Get current row IDs
          const currentRowIds = rows.map(row => row.blank_id || row.id);
          
          // Check if we need to update
          const needsUpdate = 
            expectedQuestionIds.length !== currentRowIds.length ||
            !expectedQuestionIds.every(id => currentRowIds.includes(id)) ||
            currentRowIds.some(id => !expectedQuestionIds.includes(id));
          
          if (needsUpdate) {
            // Preserve existing row data
            const rowDataMap = {};
            rows.forEach(row => {
              const id = row.blank_id || row.id;
              rowDataMap[id] = row;
            });
            
            // Create new rows for the range
            // Preserve headings/subheadings that are not question rows
            const headingRows = rows.filter(r => r.type === "heading" || r.type === "subheading");
            const newRows = expectedQuestionIds.map(id => {
              if (rowDataMap[id]) {
                // Ensure existing rows have type field
                return {
                  ...rowDataMap[id],
                  type: rowDataMap[id].type || "question",
                };
              } else {
                return {
                  type: "question",
                  id: id,
                  pre_text: "",
                  blank_id: id,
                  post_text: "",
                };
              }
            });
            // Note: Headings are preserved in their original positions by the rowDataMap logic above
            
            dispatch({
              type: "PATCH",
              payload: { 
                content: { 
                  ...state.content, 
                  rows: newRows 
                } 
              },
            });
            
            // Update correct_answer structure
            const answers = state.correct_answer?.values || {};
            const newAnswers = { ...answers };
            let answersUpdated = false;
            
            expectedQuestionIds.forEach(id => {
              if (!(id in newAnswers)) {
                newAnswers[id] = "";
                answersUpdated = true;
              }
            });
            
            Object.keys(newAnswers).forEach(key => {
              const num = Number(key);
              if (num < state.question_number_start || num > state.question_number_end) {
                delete newAnswers[key];
                answersUpdated = true;
              }
            });
            
            if (answersUpdated) {
              dispatch({
                type: "PATCH",
                payload: { correct_answer: { values: newAnswers } },
              });
            }
          }
        }
      }
    }
  }, [state.question_number_start, state.question_number_end, state.question_type, state.content?.summary_type]);

  // Ensure SUMMARY_FILL_BLANKS always has summary_type set
  useEffect(() => {
    if (state.question_type === "SUMMARY_FILL_BLANKS" && !state.content?.summary_type) {
      dispatch({
        type: "PATCH",
        payload: {
          content: {
            ...state.content,
            summary_type: "story",
            blanks: state.content?.blanks || [],
            rows: state.content?.rows || [],
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.question_type]);

  // Initialize SUMMARY_FILL_BLANKS items/rows if empty (moved from renderSummaryFill to fix Hooks violation)
  useEffect(() => {
    if (state.question_type === "SUMMARY_FILL_BLANKS") {
      const summaryType = state.content?.summary_type || "story";
      const isGrouped = state.question_number_end > state.question_number_start;
      
      if (summaryType === "story") {
        // Story mode: Initialize items array if empty
        const items = state.content?.items || [];
        if (items.length === 0) {
          const newItems = [];
          if (isGrouped) {
            for (let i = state.question_number_start; i <= state.question_number_end; i++) {
              newItems.push({
                type: "question",
                id: String(i),
                pre: "",
                post: "",
                is_bullet: false,
              });
            }
          } else {
            newItems.push({
              type: "question",
              id: String(state.question_number_start),
              pre: "",
              post: "",
              is_bullet: false,
            });
          }
          updateContent({ ...state.content, items: newItems });
        }
      } else {
        // Bullet/Numbered mode: Initialize rows array if empty
        const rows = state.content?.rows || [];
        if (rows.length === 0) {
          const newRows = [];
          if (isGrouped) {
            for (let i = state.question_number_start; i <= state.question_number_end; i++) {
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
              id: String(state.question_number_start),
              pre_text: "",
              blank_id: String(state.question_number_start),
              post_text: "",
            });
          }
          updateContent({ ...state.content, rows: newRows });
        } else {
          // Ensure all existing rows have type field for backward compatibility
          const needsTypeUpdate = rows.some(r => !r.type);
          if (needsTypeUpdate) {
            const updatedRows = rows.map(r => ({
              ...r,
              type: r.type || "question",
            }));
            updateContent({ ...state.content, rows: updatedRows });
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.question_type, state.question_number_start, state.question_number_end]);

  // Auto-sync blanks from text in Story Mode
  useEffect(() => {
    if (state.question_type === "SUMMARY_FILL_BLANKS" && state.content?.summary_type === "story") {
      const text = state.content?.text || "";
      
      // Extract blank IDs using regex: ___(ID)___
      const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
      const extractedBlankIds = blankMatches.map(match => 
        match.replace(/___\(([^)]+)\)___/, "$1")
      );
      
      // Remove duplicates and sort
      const uniqueBlankIds = [...new Set(extractedBlankIds)].sort((a, b) => {
        // Try numeric sort first, then string sort
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });
      
      // Get current blanks array
      const currentBlanks = state.content?.blanks || [];
      
      // Check if we need to update
      const needsUpdate = 
        uniqueBlankIds.length !== currentBlanks.length ||
        !uniqueBlankIds.every(id => currentBlanks.includes(id)) ||
        currentBlanks.some(id => !uniqueBlankIds.includes(id));
      
      if (needsUpdate) {
        // Preserve existing answer data
        const answers = state.correct_answer?.values || {};
        const newAnswers = { ...answers };
        
        // Remove answers for deleted blanks
        Object.keys(newAnswers).forEach(key => {
          if (!uniqueBlankIds.includes(key)) {
            delete newAnswers[key];
          }
        });
        
        // Add empty answers for new blanks (only if they don't exist)
        uniqueBlankIds.forEach(id => {
          if (!(id in newAnswers)) {
            newAnswers[id] = "";
          }
        });
        
        // Update content with new blanks array
        dispatch({
          type: "PATCH",
          payload: {
            content: {
              ...state.content,
              blanks: uniqueBlankIds,
            },
            correct_answer: {
              values: newAnswers,
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.content?.text, state.content?.summary_type, state.question_type]);

  const typeOptions = useMemo(
    () =>
      Object.entries(QUESTION_TYPE_CONFIG).map(([value, meta]) => ({
        value,
        label: meta.label,
        helper: meta.helper,
      })),
    []
  );

  const selectedTypeMeta = QUESTION_TYPE_CONFIG[state.question_type];

  if (!isOpen) return null;

  const updateContent = (next) =>
    dispatch({
      type: "PATCH",
      payload: { content: next },
    });

  const updateAnswer = (next) =>
    dispatch({
      type: "PATCH",
      payload: { correct_answer: next },
    });

  const handleTypeChange = (value) => {
    dispatch({
      type: "PATCH",
      payload: {
        question_type: value,
        content: defaultContentByType[value]
          ? defaultContentByType[value](state.question_number_start, state.question_number_end)
          : {},
        correct_answer: defaultAnswerByType[value]
          ? defaultAnswerByType[value](state.question_number_start, state.question_number_end)
          : {},
      },
    });
  };

  const validateState = () => {
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

    if (state.question_type.startsWith("MCQ")) {
      const isGrouped = state.question_number_end > state.question_number_start;
      const useSameOptions = state.content?.use_same_options !== false; // Default to true
      
      // Check if using independent options mode
      if (isGrouped && !useSameOptions) {
        // Independent Options Mode: Validate each question's options
        const questions = state.content?.questions || [];
        const questionRange = [];
        for (let i = state.question_number_start; i <= state.question_number_end; i++) {
          questionRange.push(String(i));
        }
        
        // Check that we have questions for all question numbers
        if (questions.length === 0) {
          return "Add questions for independent options mode.";
        }
        
        // Validate each question
        for (const qNum of questionRange) {
          const question = questions.find(q => q.id === qNum);
          if (!question) {
            return `Question Q${qNum} is missing in independent options mode.`;
          }
          
          // Validate options for this question
          const questionOptions = question.options || [];
          if (questionOptions.length < 2) {
            return `Q${qNum}: Provide at least two options.`;
          }
          if (questionOptions.some((opt) => !opt.text?.trim())) {
            return `Q${qNum}: All options must have text.`;
          }
          
          // Validate correct answer for this question
          const values = state.correct_answer?.values || {};
          const answer = values[qNum];
          if (!answer || String(answer).trim().length === 0) {
            return `Q${qNum}: Select the correct answer.`;
          }
        }
      } else {
        // Same Options Mode: Validate shared options
        const options = state.content?.options || [];
        if (options.length < 2 || options.some((opt) => !opt.text?.trim())) {
          return "Provide at least two MCQ options with text.";
        }
        
        if (state.question_type === "MCQ_SINGLE") {
          if (isGrouped) {
            // For grouped MCQ with same options, check that all sub-questions have answers
            const values = state.correct_answer?.values || {};
            // Iterate through the question range and verify each has an answer
            for (let i = state.question_number_start; i <= state.question_number_end; i++) {
              const key = String(i);
              const answer = values[key];
              if (!answer || String(answer).trim().length === 0) {
                return `Select correct answer for Q${i}.`;
              }
            }
          } else {
            // Single question
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
    }

    if (state.question_type === "MATCHING_DRAG_DROP") {
      const pairs = state.correct_answer?.pairs || [];
      if (!pairs.length) {
        return "Map at least one pair for matching questions.";
      }
    }

    if (state.question_type === "SHORT_ANSWER") {
      const isGrouped = state.question_number_end > state.question_number_start;
      if (isGrouped) {
        // For grouped SHORT_ANSWER, check that all sub-questions have answers
        const values = state.correct_answer?.values || {};
        const questionRange = state.question_number_end - state.question_number_start + 1;
        const answeredCount = Object.keys(values).filter(
          (key) => values[key] && String(values[key]).trim().length > 0
        ).length;
        if (answeredCount !== questionRange) {
          return `Provide model answers for all ${questionRange} sub-questions.`;
        }
      } else {
        // Single question
        if (!state.correct_answer?.value) {
          return "Provide model answer for short answer.";
        }
      }
    }

    if (state.question_type === "TFNG") {
      const isGrouped = state.question_number_end > state.question_number_start;
      if (isGrouped) {
        // For grouped TFNG, check that all sub-questions have answers
        const values = state.correct_answer?.values || {};
        const questionRange = state.question_number_end - state.question_number_start + 1;
        const answeredCount = Object.keys(values).filter(
          (key) => values[key] && String(values[key]).trim().length > 0
        ).length;
        if (answeredCount !== questionRange) {
          return `Select answers (True/False/Not Given) for all ${questionRange} sub-questions.`;
        }
      } else {
        // Single question
        if (!state.correct_answer?.value) {
          return "Select T, F, or NG.";
        }
      }
    }

    if (state.question_type === "SUMMARY_FILL_BLANKS") {
      const summaryType = state.content?.summary_type || "story";
      
      if (summaryType === "story") {
        // Story mode: Check text field
        const text = state.content?.text || "";
        if (!text.trim()) {
          return "Enter summary text in Story mode.";
        }
        // Check for at least one blank placeholder
        const blanks = state.content?.blanks || [];
        if (blanks.length === 0) {
          return "Add at least one blank placeholder (e.g., ___(6)___) in your summary text.";
        }
        // Check that all blanks have answers
        const answers = state.correct_answer?.values || {};
        const unansweredBlanks = blanks.filter(
          (id) => !answers[id] || String(answers[id]).trim().length === 0
        );
        if (unansweredBlanks.length > 0) {
          return `Fill correct answers for all ${blanks.length} blank${blanks.length > 1 ? 's' : ''}.`;
        }
      } else {
        // Bullet/Numbered mode: Check rows array
        const rows = state.content?.rows || [];
        const questionRows = rows.filter(row => row.type === "question" || !row.type);
        if (questionRows.length === 0) {
          return "Add at least one question row.";
        }
        // Check that all question rows have correct answers (skip headings)
        const answers = state.correct_answer?.values || {};
        const unansweredRows = questionRows.filter(
          (row) => {
            const blankId = row.blank_id || row.id;
            return !answers[blankId] || String(answers[blankId]).trim().length === 0;
          }
        );
        if (unansweredRows.length > 0) {
          return `Fill correct answers for all ${questionRows.length} question row${questionRows.length > 1 ? 's' : ''}.`;
        }
      }
    }

    if (state.question_type === "SUMMARY_DRAG_DROP") {
      const blanks = state.content?.blanks || [];
      const answers = state.correct_answer?.values || {};
      if (!blanks.length) {
        return "Add at least one blank.";
      }
      const filledAll = blanks.every((id) => answers[id]);
      if (!filledAll) {
        return "Fill answers for all blanks.";
      }
    }

    if (state.question_type === "MAP_LABELLING") {
      if (!state.content?.map_image_url) {
        return "Provide map image URL.";
      }
    }

    return null;
  };

  const preparePayload = () => ({
    section: section.id,
    question_type: state.question_type,
    question_number_start: Number(state.question_number_start),
    question_number_end: Number(state.question_number_end),
    prompt: state.prompt,
    content: state.content,
    correct_answer: state.correct_answer,
  });

  const handleSubmit = async () => {
    const error = validateState();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = preparePayload();
    setIsSubmitting(true);
    try {
      if (question?.id) {
        await authAxios.patch(`/mock-questions/${question.id}/`, payload);
        toast.success("Question updated");
      } else {
        await authAxios.post("/mock-questions/", payload);
        toast.success("Question created");
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const message =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Unable to save question";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTfngBuilder = () => {
    const options = [
      { value: "TRUE", label: "True" },
      { value: "FALSE", label: "False" },
      { value: "NOT GIVEN", label: "Not Given" },
    ];

    // Check if this is a grouped question
    const isGrouped = state.question_number_end > state.question_number_start;
    const statements = state.content?.statements || [];

    // For grouped questions, render multiple inputs
    if (isGrouped) {
      const questionRange = [];
      for (let i = state.question_number_start; i <= state.question_number_end; i++) {
        questionRange.push(i);
      }

      const currentValues = state.correct_answer?.values || {};

      return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">
            Correct answers (Q{state.question_number_start}-{state.question_number_end})
          </p>
          
          {/* Optional: Add statements input */}
          {statements.length === 0 && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Sub-question statements (optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  const newStatements = [];
                  for (let i = state.question_number_start; i <= state.question_number_end; i++) {
                    newStatements.push("");
                  }
                  updateContent({ ...state.content, statements: newStatements });
                }}
                className="text-sm text-main hover:underline"
              >
                Add statements for each sub-question
              </button>
            </div>
          )}

          {statements.length > 0 && (
            <div className="mb-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Sub-question statements
              </label>
              {statements.map((stmt, idx) => {
                const qNum = state.question_number_start + idx;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 min-w-[40px]">
                      Q{qNum}:
                    </span>
                    <input
                      type="text"
                      value={stmt}
                      onChange={(e) => {
                        const newStatements = [...statements];
                        newStatements[idx] = e.target.value;
                        updateContent({ ...state.content, statements: newStatements });
                      }}
                      placeholder={`Statement for Q${qNum}`}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/20"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {questionRange.map((qNum) => {
              const currentValue = currentValues[String(qNum)] || "";
              return (
                <div key={qNum} className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Q{qNum} {statements[qNum - state.question_number_start] && (
                      <span className="font-normal text-slate-500">
                        - {statements[qNum - state.question_number_start]}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const newValues = { ...currentValues };
                          newValues[String(qNum)] = option.value;
                          updateAnswer({ values: newValues });
                        }}
                        className={`flex-1 min-w-[120px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          currentValue === option.value
                            ? "border-main bg-main/10 text-main"
                            : "border-slate-200 text-slate-600 hover:border-main/60"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Single question (non-grouped) - original behavior
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-700">Correct answer</p>
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateAnswer({ value: option.value })}
              className={`flex-1 min-w-[120px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                state.correct_answer?.value === option.value
                  ? "border-main bg-main/10 text-main"
                  : "border-slate-200 text-slate-600 hover:border-main/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSummaryFill = () => {
    const isGrouped = state.question_number_end > state.question_number_start;
    // Always default to "story" if summary_type is not set
    const summaryType = state.content?.summary_type || "story";
    const items = state.content?.items || [];
    const rows = state.content?.rows || [];
    const text = state.content?.text || "";
    const answers = state.correct_answer?.values || {};

    // Handle mode change
    const handleModeChange = (newMode) => {
      const isGrouped = state.question_number_end > state.question_number_start;
      let newContent = { ...state.content, summary_type: newMode };
      
      if (newMode === "story") {
        // Story mode: use text field
        if (!newContent.text) {
          newContent.text = "";
        }
      } else {
        // Bullet/Numbered mode: use rows array
        if (!newContent.rows || newContent.rows.length === 0) {
          const newRows = [];
          if (isGrouped) {
            for (let i = state.question_number_start; i <= state.question_number_end; i++) {
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
              id: String(state.question_number_start),
              pre_text: "",
              blank_id: String(state.question_number_start),
              post_text: "",
            });
          }
          newContent.rows = newRows;
        }
      }
      updateContent(newContent);
    };

    const updateItem = (index, key, value) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [key]: value };
      updateContent({ ...state.content, items: newItems });
    };

    const updateRow = (index, key, value) => {
      const newRows = [...rows];
      newRows[index] = { ...newRows[index], [key]: value };
      updateContent({ ...state.content, rows: newRows });
    };

    const updateAnswerValue = (itemId, value) => {
      updateAnswer({
        values: {
          ...answers,
          [itemId]: value,
        },
      });
    };

    const addRow = (type = "question", insertAfterIndex = null) => {
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
        // Question row
        const questionRows = rows.filter(r => r.type === "question" || !r.type);
        const nextId = questionRows.length > 0 
          ? String(Math.max(...questionRows.map(r => Number(r.blank_id || r.id || 0))) + 1)
          : String(state.question_number_start + questionRows.length);
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
      updateContent({ ...state.content, rows: newRows });
    };

    const removeRow = (index) => {
      const newRows = rows.filter((_, i) => i !== index);
      updateContent({ ...state.content, rows: newRows });
    };

    const moveRow = (index, direction) => {
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === rows.length - 1)
      ) {
        return;
      }
      const newRows = [...rows];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
      updateContent({ ...state.content, rows: newRows });
    };

    const addItem = (type, insertAfterIndex = null) => {
      const newItems = [...items];
      const newItem = type === "heading" 
        ? { type: "heading", text: "" }
        : type === "subheading"
        ? { type: "subheading", text: "" }
        : {
            type: "question",
            id: String(state.question_number_start + items.filter(i => i.type === "question").length),
            pre: "",
            post: "",
            is_bullet: false,
          };
      
      if (insertAfterIndex !== null) {
        newItems.splice(insertAfterIndex + 1, 0, newItem);
      } else {
        newItems.push(newItem);
      }
      updateContent({ ...state.content, items: newItems });
    };

    const removeItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      updateContent({ ...state.content, items: newItems });
    };

    const moveItem = (index, direction) => {
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === items.length - 1)
      ) {
        return;
      }
      const newItems = [...items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      updateContent({ ...state.content, items: newItems });
    };

    // Count question items/rows
    const questionItemsCount = summaryType === "story" 
      ? items.filter(item => item.type === "question").length
      : rows.length;
    const expectedQuestionCount = isGrouped 
      ? (state.question_number_end - state.question_number_start + 1)
      : 1;

    // Render Story Mode (Rich Text Editor)
    const renderStoryMode = () => {
      const blanks = state.content?.blanks || [];
      
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
              onChange={(value) => updateContent({ ...state.content, text: value })}
              placeholder="Enter your summary text with blanks (e.g., ___(6)___)"
            />
          </div>
          
          {/* Auto-generated Correct Answer inputs */}
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
                    <input
                      type="text"
                      value={answers[blankId] || ""}
                      onChange={(e) => updateAnswerValue(blankId, e.target.value)}
                      placeholder={`Correct answer for blank ${blankId}`}
                      className="flex-1 px-3 py-2 text-sm border border-dashed rounded-lg border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                    />
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

    // Render List Mode (Bullet or Numbered)
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
                ? `Question range Q${state.question_number_start}-${state.question_number_end} automatically generates ${expectedQuestionCount} rows.`
                : `Single question Q${state.question_number_start}. Add more rows as needed.`
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
                  {rows.length} row{rows.length !== 1 ? 's' : ''} • {rows.filter(r => r.type === "question" || !r.type).length} question{rows.filter(r => r.type === "question" || !r.type).length !== 1 ? 's' : ''} • {rows.filter(r => r.type === "heading" || r.type === "subheading").length} heading{rows.filter(r => r.type === "heading" || r.type === "subheading").length !== 1 ? 's' : ''} • {rows.filter(r => r.type === "text").length} info row{rows.filter(r => r.type === "text").length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addRow("heading")}
                  className="px-3 py-1.5 text-xs font-medium transition bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                >
                  + Heading
                </button>
              </div>
            </div>

            {/* Insertion menu component (shown between rows) */}
            {(() => {
              const InsertMenu = ({ insertAfterIndex }) => (
                <div className="flex items-center justify-center py-1 group">
                  <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => addRow("subheading", insertAfterIndex)}
                      className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                      title="Insert sub-heading here"
                    >
                      <Plus size={12} className="inline mr-1" />
                      Sub-heading
                    </button>
                    <button
                      type="button"
                      onClick={() => addRow("text", insertAfterIndex)}
                      className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                      title="Insert info row here"
                    >
                      <Plus size={12} className="inline mr-1" />
                      Info Row
                    </button>
                    <button
                      type="button"
                      onClick={() => addRow("question", insertAfterIndex)}
                      className="px-2 py-1 text-xs font-medium transition bg-white border rounded border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                      title="Insert question row here"
                    >
                      <Plus size={12} className="inline mr-1" />
                      Question
                    </button>
                  </div>
                </div>
              );

              return (
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
                      <InsertMenu insertAfterIndex={index} />
                    </React.Fragment>
                  );
                }

                // Render text-only rows (info rows without blanks)
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
                            {isNumbered && (
                              <span className="text-xs font-semibold text-center text-slate-500">
                                {listItemIndex + 1}
                              </span>
                            )}
                            {!isNumbered && (
                              <span className="text-xs font-semibold text-center text-slate-500">
                                •
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block mb-1 text-xs font-medium text-slate-600">
                              Info Text (No blank)
                            </label>
                            <input
                              type="text"
                              value={row.text || ""}
                              onChange={(e) => updateRow(index, "text", e.target.value)}
                              placeholder="Enter informational text (e.g., Travel on an old steamship)"
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
                      <InsertMenu insertAfterIndex={index} />
                    </React.Fragment>
                  );
                }

                // Render question rows
                const rowType = row.type || "question"; // Default to question for backward compatibility
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
                          {isNumbered && (
                            <span className="text-xs font-semibold text-center text-slate-500">
                              {questionIndex + 1}
                            </span>
                          )}
                          {!isNumbered && (
                            <span className="text-xs font-semibold text-center text-slate-500">
                              •
                            </span>
                          )}
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
                            <input
                              type="text"
                              value={answers[row.blank_id || row.id] || ""}
                              onChange={(e) => updateAnswerValue(row.blank_id || row.id, e.target.value)}
                              placeholder="Correct answer for this blank"
                              className="w-full px-3 py-2 text-sm border border-dashed rounded-lg border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (row.type === "question" || !row.type) {
                              if (confirm("Are you sure you want to delete this question row? This may break the question sequence.")) {
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
                    <InsertMenu insertAfterIndex={index} />
                  </React.Fragment>
                );
              })}
                </div>
              );
            })()}

            {rows.length === 0 && (
              <div className="p-6 text-sm text-center border border-dashed text-slate-500 rounded-xl border-slate-300">
                No rows yet. Click "+ Add Row" to add rows.
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

        {/* Word Limit (applies to all modes) */}
        <div>
          <label className="text-sm font-medium text-slate-700">
            Word limit per blank
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={state.content?.word_limit || ""}
            onChange={(e) =>
              updateContent({
                ...state.content,
                word_limit: Number(e.target.value),
              })
            }
            className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
      </div>
    );
  };

  const renderSummaryDragDrop = () => {
    const blanks = state.content?.blanks || [];
    const answers = state.correct_answer?.values || {};
    const wordBank = state.content?.word_bank || [];

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Stimulus text
          </label>
          <textarea
            rows={4}
            value={state.content?.text || ""}
            onChange={(e) =>
              updateContent({ ...state.content, text: e.target.value })
            }
            placeholder="Describe scenario and include (A), (B) placeholders."
            className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">
            Word bank
          </label>
          <div className="flex flex-wrap gap-3">
            {wordBank.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-600"
              >
                {word}
                <button
                  type="button"
                  className="ml-2 text-slate-400 hover:text-red-500"
                  onClick={() =>
                    updateContent({
                      ...state.content,
                      word_bank: wordBank.filter((_, idx) => idx !== index),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add word"
              className="flex-1 px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  updateContent({
                    ...state.content,
                    word_bank: [...wordBank, e.target.value.trim()],
                  });
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Blanks</p>
            <button
              type="button"
              onClick={() =>
                updateContent({
                  ...state.content,
                  blanks: [...blanks, alphabet[blanks.length] || "?"],
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
            >
              + Blank
            </button>
          </div>
          <div className="space-y-3">
            {blanks.map((blank, index) => (
              <div
                key={`${blank}-${index}`}
                className="flex flex-col gap-3 p-4 bg-white border rounded-2xl border-slate-200 md:flex-row md:items-center"
              >
                <div className="text-sm font-semibold text-slate-600">
                  Blank {blank}
                </div>
                <input
                  type="text"
                  value={answers[blank] || ""}
                  onChange={(e) =>
                    updateAnswer({
                      values: {
                        ...answers,
                        [blank]: e.target.value,
                      },
                    })
                  }
                  placeholder="Correct word"
                  className="flex-1 px-3 py-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMapBuilder = () => {
    const regions = state.content?.regions || [];
    const labels = state.correct_answer?.labels || {};

    const updateRegion = (id, key, value) => {
      updateContent({
        ...state.content,
        regions: regions.map((region) =>
          region.id === id
            ? {
                ...region,
                [key]:
                  key === "coordinates"
                    ? { ...region.coordinates, ...value }
                    : value,
              }
            : region
        ),
      });
    };

    const updateLabel = (id, value) => {
      updateAnswer({
        labels: { ...labels, [id]: value },
      });
    };

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Map image URL
          </label>
          <input
            type="url"
            value={state.content?.map_image_url || ""}
            onChange={(e) =>
              updateContent({
                ...state.content,
                map_image_url: e.target.value,
              })
            }
            placeholder="https://..."
            className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Instructions
          </label>
          <textarea
            rows={3}
            value={state.content?.instructions || ""}
            onChange={(e) =>
              updateContent({
                ...state.content,
                instructions: e.target.value,
              })
            }
            className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Regions</p>
            <button
              type="button"
              onClick={() =>
                updateContent({
                  ...state.content,
                  regions: [
                    ...regions,
                    {
                      id: createId(),
                      label: `Region ${regions.length + 1}`,
                      coordinates: { x: 0, y: 0 },
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
            >
              + Region
            </button>
          </div>
          <div className="space-y-4">
            {regions.map((region) => (
              <div
                key={region.id}
                className="grid gap-3 p-4 bg-white border rounded-2xl border-slate-200 md:grid-cols-2"
              >
                <input
                  type="text"
                  value={region.label}
                  onChange={(e) => updateRegion(region.id, "label", e.target.value)}
                  placeholder="Region label"
                  className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <input
                  type="text"
                  value={labels[region.id] || ""}
                  onChange={(e) => updateLabel(region.id, e.target.value)}
                  placeholder="Correct letter/value"
                  className="px-3 py-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <input
                  type="number"
                  value={region.coordinates?.x || 0}
                  onChange={(e) =>
                    updateRegion(region.id, "coordinates", {
                      x: Number(e.target.value),
                    })
                  }
                  placeholder="X (0-100)"
                  className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <input
                  type="number"
                  value={region.coordinates?.y || 0}
                  onChange={(e) =>
                    updateRegion(region.id, "coordinates", {
                      y: Number(e.target.value),
                    })
                  }
                  placeholder="Y (0-100)"
                  className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFlowchartBuilder = () => {
    const steps = state.content?.steps || [];
    const values = state.correct_answer?.values || {};

    const updateStep = (id, key, value) => {
      updateContent({
        ...state.content,
        steps: steps.map((step) =>
          step.id === id ? { ...step, [key]: value } : step
        ),
      });
    };

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Allowed words hint
          </label>
          <input
            type="text"
            value={state.content?.allowed_words || ""}
            onChange={(e) =>
              updateContent({
                ...state.content,
                allowed_words: e.target.value,
              })
            }
            placeholder="Write NO MORE THAN TWO WORDS"
            className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Steps</p>
            <button
              type="button"
              onClick={() =>
                updateContent({
                  ...state.content,
                  steps: [
                    ...steps,
                    { id: createId(), text: "", blank_id: "" },
                  ],
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
            >
              + Step
            </button>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="grid gap-3 p-4 bg-white border rounded-2xl border-slate-200 md:grid-cols-3"
              >
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Step {index + 1}
                  </label>
                  <textarea
                    rows={2}
                    value={step.text}
                    onChange={(e) => updateStep(step.id, "text", e.target.value)}
                    placeholder="Describe the step content"
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Blank ID
                  </label>
                  <input
                    type="text"
                    value={step.blank_id || ""}
                    onChange={(e) => updateStep(step.id, "blank_id", e.target.value)}
                    placeholder="A, B..."
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                  />
                  {step.blank_id && (
                    <input
                      type="text"
                      value={values[step.blank_id] || ""}
                      onChange={(e) =>
                        updateAnswer({
                          values: {
                            ...values,
                            [step.blank_id]: e.target.value,
                          },
                        })
                      }
                      placeholder="Correct answer"
                      className="w-full px-3 py-2 mt-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBuilder = () => {
    switch (state.question_type) {
      case "MCQ_SINGLE":
      case "MCQ_MULTIPLE":
        return (
          <McqBuilder
            questionType={state.question_type}
            content={state.content}
            correctAnswer={state.correct_answer}
            questionNumberStart={state.question_number_start}
            questionNumberEnd={state.question_number_end}
            onContentChange={updateContent}
            onAnswerChange={updateAnswer}
          />
        );
      case "MATCHING_DRAG_DROP":
        return (
          <MatchingBuilder
            content={state.content}
            correctAnswer={state.correct_answer}
            onContentChange={updateContent}
            onAnswerChange={updateAnswer}
          />
        );
      case "MATCHING_TABLE_CLICK":
        return (
          <TableBuilder
            mode="matching"
            content={state.content}
            correctAnswer={state.correct_answer}
            onContentChange={updateContent}
            onAnswerChange={updateAnswer}
          />
        );
      case "SHORT_ANSWER":
        return (
          <ShortAnswerBuilder
            content={state.content}
            correctAnswer={state.correct_answer}
            questionNumberStart={state.question_number_start}
            questionNumberEnd={state.question_number_end}
            onContentChange={updateContent}
            onAnswerChange={updateAnswer}
          />
        );
      case "TABLE_COMPLETION":
        return (
          <TableBuilder
            mode="completion"
            content={state.content}
            correctAnswer={state.correct_answer}
            onContentChange={updateContent}
            onAnswerChange={updateAnswer}
          />
        );
      case "TFNG":
        return renderTfngBuilder();
      case "SUMMARY_FILL_BLANKS":
        return renderSummaryFill();
      case "SUMMARY_DRAG_DROP":
        return renderSummaryDragDrop();
      case "MAP_LABELLING":
        return renderMapBuilder();
      case "FLOWCHART_COMPLETION":
        return renderFlowchartBuilder();
      default:
        return (
          <div className="p-6 text-sm border border-dashed rounded-2xl border-slate-300 text-slate-500">
            Builder for {state.question_type} is coming soon.
          </div>
        );
    }
  };

  const blockingMessage = !section
    ? "Select a section first."
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex flex-col w-full h-full max-w-5xl ml-auto overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Question editor
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              {question ? "Edit question" : "Create new question"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {blockingMessage ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-10 text-center">
            <WarningBanner message={blockingMessage} />
          </div>
        ) : (
          <div className="grid flex-1 gap-6 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div className="p-4 space-y-4 border rounded-3xl border-slate-200 bg-slate-50">
                <label className="text-sm font-semibold text-slate-600">
                  Question type
                </label>
                <select
                  value={state.question_type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-semibold bg-white border rounded-2xl border-slate-200 text-slate-700 focus:border-main focus:ring-4 focus:ring-main/10"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedTypeMeta && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles size={14} className="text-main" />
                    {selectedTypeMeta.helper}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Question starts at
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={state.question_number_start}
                    onChange={(e) =>
                      dispatch({
                        type: "PATCH",
                        payload: {
                          question_number_start: Number(e.target.value),
                          question_number_end: Math.max(
                            Number(e.target.value),
                            Number(state.question_number_end || 0)
                          ),
                        },
                      })
                    }
                    className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ends at
                  </label>
                  <input
                    type="number"
                    min={state.question_number_start}
                    value={state.question_number_end}
                    onChange={(e) =>
                      dispatch({
                        type: "PATCH",
                        payload: { question_number_end: Number(e.target.value) },
                      })
                    }
                    className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Prompt (Rich text)
                </label>
                <ReactQuill
                  theme="snow"
                  value={state.prompt}
                  onChange={(value) =>
                    dispatch({ type: "PATCH", payload: { prompt: value } })
                  }
                />
              </div>

              <div className="p-5 space-y-5 bg-white border rounded-3xl border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-900">
                    Type specific content
                  </h4>
                </div>
                {renderBuilder()}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <LivePreview state={state} section={section} />
              <div className="p-5 space-y-4 bg-white border rounded-3xl border-slate-200">
                <h4 className="text-base font-semibold text-slate-900">
                  Finalize
                </h4>
                <p className="text-sm text-slate-500">
                  Map the question to questions {state.question_number_start} –
                  {state.question_number_end} within Part {section?.part_number}.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-sm font-semibold border rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center flex-1 gap-2 px-4 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-main shadow-main/30 hover:bg-main/90 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save question
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

