import React, { useEffect, useMemo, useReducer } from "react";
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
  SUMMARY_FILL_BLANKS: () => ({
    text: "",
    blanks: [{ id: "1", label: "Blank 1" }],
    word_limit: 3,
  }),
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
  MCQ_SINGLE: () => ({ value: "" }),
  MCQ_MULTIPLE: () => ({ values: [] }),
  MATCHING_DRAG_DROP: () => ({ pairs: [] }),
  MATCHING_TABLE_CLICK: () => ({ selections: {} }),
  SHORT_ANSWER: () => ({ value: "" }),
  TFNG: () => ({ value: "" }),
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
  return {
    question_type: baseType,
    question_number_start:
      question?.question_number_start || nextNumber || 1,
    question_number_end: question?.question_number_end || nextNumber || 1,
    prompt: question?.prompt || "",
    content:
      question?.content ||
      (defaultContentByType[baseType]
        ? defaultContentByType[baseType]()
        : {}),
    correct_answer:
      question?.correct_answer ||
      (defaultAnswerByType[baseType]
        ? defaultAnswerByType[baseType]()
        : {}),
  };
}

function LivePreview({ state, section }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 space-y-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Eye size={16} />
        Student preview
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Section
        </p>
        <p className="text-lg font-semibold text-slate-800">
          Part {section?.part_number}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
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
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Prompt
        </p>
        <div
          className="prose prose-sm max-w-none text-slate-700"
          dangerouslySetInnerHTML={{
            __html: state.prompt || "<p>No prompt yet.</p>",
          }}
        />
      </div>
      <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-4 text-xs text-slate-500">
        Preview is illustrative. Exact layout will adapt to student player.
      </div>
    </div>
  );
}

function WarningBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700 text-sm">
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

  useEffect(() => {
    if (section) {
      dispatch({ type: "RESET", payload: buildInitialState(question, section) });
    }
  }, [section?.id, question?.id]);

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
          ? defaultContentByType[value]()
          : {},
        correct_answer: defaultAnswerByType[value]
          ? defaultAnswerByType[value]()
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
      const options = state.content?.options || [];
      if (options.length < 2 || options.some((opt) => !opt.text?.trim())) {
        return "Provide at least two MCQ options with text.";
      }
      if (
        state.question_type === "MCQ_SINGLE" &&
        !state.correct_answer?.value
      ) {
        return "Select the correct MCQ option.";
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

    if (state.question_type === "SHORT_ANSWER" && !state.correct_answer?.value) {
      return "Provide model answer for short answer.";
    }

    if (state.question_type === "TFNG" && !state.correct_answer?.value) {
      return "Select T, F, or NG.";
    }

    if (
      state.question_type === "SUMMARY_FILL_BLANKS" ||
      state.question_type === "SUMMARY_DRAG_DROP"
    ) {
      const blanks =
        state.question_type === "SUMMARY_DRAG_DROP"
          ? state.content?.blanks || []
          : state.content?.blanks?.map((blank) => blank.id) || [];
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
      { value: "T", label: "True" },
      { value: "F", label: "False" },
      { value: "NG", label: "Not Given" },
    ];
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
    const blanks = state.content?.blanks || [];
    const answers = state.correct_answer?.values || {};

    const updateBlank = (id, key, value) => {
      updateContent({
        ...state.content,
        blanks: blanks.map((blank) =>
          blank.id === id ? { ...blank, [key]: value } : blank
        ),
      });
    };

    const updateAnswerValue = (blankId, value) => {
      updateAnswer({
        values: {
          ...answers,
          [blankId]: value,
        },
      });
    };

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Summary text
          </label>
          <textarea
            rows={4}
            value={state.content?.text || ""}
            onChange={(e) =>
              updateContent({ ...state.content, text: e.target.value })
            }
            placeholder="Write your summary and use placeholders like __(1)__ for blanks."
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Word limit
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
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Blanks</p>
            <button
              type="button"
              onClick={() =>
                updateContent({
                  ...state.content,
                  blanks: [
                    ...blanks,
                    {
                      id: `${blanks.length + 1}`,
                      label: `Blank ${blanks.length + 1}`,
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              + Blank
            </button>
          </div>
          <div className="space-y-3">
            {blanks.map((blank) => (
              <div
                key={blank.id}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
              >
                <input
                  type="text"
                  value={blank.label}
                  onChange={(e) =>
                    updateBlank(blank.id, "label", e.target.value)
                  }
                  placeholder="Blank label"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <input
                  type="text"
                  value={answers[blank.id] || ""}
                  onChange={(e) => updateAnswerValue(blank.id, e.target.value)}
                  placeholder="Correct answer"
                  className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                />
              </div>
            ))}
          </div>
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
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
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
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              + Blank
            </button>
          </div>
          <div className="space-y-3">
            {blanks.map((blank, index) => (
              <div
                key={`${blank}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center"
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
                  className="flex-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              + Region
            </button>
          </div>
          <div className="space-y-4">
            {regions.map((region) => (
              <div
                key={region.id}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
              >
                <input
                  type="text"
                  value={region.label}
                  onChange={(e) => updateRegion(region.id, "label", e.target.value)}
                  placeholder="Region label"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <input
                  type="text"
                  value={labels[region.id] || ""}
                  onChange={(e) => updateLabel(region.id, e.target.value)}
                  placeholder="Correct letter/value"
                  className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              + Step
            </button>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3"
              >
                <div className="md:col-span-2">
                  <label className="text-xs uppercase text-slate-500 font-semibold">
                    Step {index + 1}
                  </label>
                  <textarea
                    rows={2}
                    value={step.text}
                    onChange={(e) => updateStep(step.id, "text", e.target.value)}
                    placeholder="Describe the step content"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-slate-500 font-semibold">
                    Blank ID
                  </label>
                  <input
                    type="text"
                    value={step.blank_id || ""}
                    onChange={(e) => updateStep(step.id, "blank_id", e.target.value)}
                    placeholder="A, B..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
                      className="mt-2 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
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
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
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
      <div className="relative ml-auto flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Question editor
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              {question ? "Edit question" : "Create new question"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {blockingMessage ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <WarningBanner message={blockingMessage} />
          </div>
        ) : (
          <div className="grid flex-1 gap-6 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <label className="text-sm font-semibold text-slate-600">
                  Question type
                </label>
                <select
                  value={state.question_type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:border-main focus:ring-4 focus:ring-main/10"
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10"
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

              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-5">
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
              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
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
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-main px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-main/30 hover:bg-main/90 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
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

