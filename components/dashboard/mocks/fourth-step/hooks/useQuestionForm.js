/**
 * useQuestionForm Hook
 * Manages question editor state, validation, and submission logic
 */

import { useCallback, useEffect, useReducer, useState } from "react";
import { toast } from "react-toastify";
import { authAxios } from "@/utils/axios";
import { defaultContentByType, defaultAnswerByType } from "../utils/questionConfig";
import { sanitizeState, buildInitialState } from "../utils/questionUtils";
import { validateState } from "../utils/questionValidation";

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
      return action.payload;
    case "PATCH":
      return sanitizeState({ ...state, ...action.payload }, action.meta);
    default:
      return state;
  }
}

export const useQuestionForm = (section, question) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state when section or question changes
  useEffect(() => {
    if (section) {
      dispatch({
        type: "RESET",
        payload: buildInitialState(question, section),
        meta: { section },
      });
    }
  }, [section?.id, question?.id]);

  // Memoized update functions to prevent unnecessary re-renders
  const patchState = useCallback(
    (payload) => {
      dispatch({ type: "PATCH", payload, meta: { section } });
    },
    [section]
  );

  const updateContent = useCallback(
    (next) => patchState({ content: next }),
    [patchState]
  );

  const updateAnswer = useCallback(
    (next) => patchState({ correct_answer: next }),
    [patchState]
  );

  const updatePrompt = useCallback(
    (value) => patchState({ prompt: value }),
    [patchState]
  );

  const updateQuestionRange = useCallback(
    (start, end) => {
      patchState({
        question_number_start: Number(start),
        question_number_end: Number(end),
      });
    },
    [patchState]
  );

  const handleTypeChange = useCallback(
    (value) => {
      patchState({
        question_type: value,
        content: defaultContentByType[value]
          ? defaultContentByType[value](state.question_number_start, state.question_number_end, section)
          : {},
        correct_answer: defaultAnswerByType[value]
          ? defaultAnswerByType[value](state.question_number_start, state.question_number_end, section)
          : {},
      });
    },
    [patchState, state.question_number_start, state.question_number_end, section]
  );

  const preparePayload = useCallback(() => ({
    section: section.id,
    question_type: state.question_type,
    question_number_start: Number(state.question_number_start),
    question_number_end: Number(state.question_number_end),
    prompt: state.prompt,
    content: state.content,
    correct_answer: state.correct_answer,
  }), [section, state]);

  const handleSubmit = useCallback(async (onSuccess, onClose) => {
    const error = validateState(state, section);
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
      onClose?.();
    } catch (e) {
      const message =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Unable to save question";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [state, section, question, preparePayload]);

  return {
    state,
    isSubmitting,
    updateContent,
    updateAnswer,
    updatePrompt,
    updateQuestionRange,
    handleTypeChange,
    handleSubmit,
    patchState,
  };
};

