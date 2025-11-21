import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";

/**
 * useExamEngine
 * 
 * Custom hook to manage exam state, timer, auto-save, and submission.
 * 
 * @param {Object} task - Task object from API
 * @param {Object} normalizedData - Normalized exam data (sections, questions)
 * @param {Object} existingDraft - Existing draft submission (if any)
 * @returns {Object} Exam engine state and methods
 */
export function useExamEngine(task, normalizedData, existingDraft) {
  const intl = useIntl();
  const router = useRouter();
  
  // Answers state: { question_id: { value: ... } }
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // idle, saving, saved, error
  const autoSaveTimerRef = useRef(null);
  const lastSavedAnswersRef = useRef({});
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize answers from existing draft
  useEffect(() => {
    if (existingDraft && existingDraft.answers) {
      const draftAnswers = {};
      existingDraft.answers.forEach((answer) => {
        draftAnswers[String(answer.question_id)] = answer.answer_data || {};
      });
      setAnswers(draftAnswers);
      lastSavedAnswersRef.current = { ...draftAnswers };
    }
  }, [existingDraft]);

  // Initialize timer
  useEffect(() => {
    if (!task) return;

    let durationSeconds = null;

    // Calculate duration based on task type
    if (task.duration_minutes && task.duration_minutes > 0) {
      durationSeconds = task.duration_minutes * 60;
    } else if (task.end_time && task.start_time) {
      // For EXAM_MOCK with time window
      const endTime = new Date(task.end_time);
      const now = new Date();
      durationSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
    } else if (task.custom_content?.time_limit_minutes) {
      // For QUIZ with custom time limit
      durationSeconds = task.custom_content.time_limit_minutes * 60;
    }

    if (durationSeconds && durationSeconds > 0) {
      setTimeRemaining(durationSeconds);
    }

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [task]);

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && timeRemaining === 0) {
      handleFinalSubmit(true); // auto-submit
    }
  }, [isTimeUp, timeRemaining]);

  // Auto-save logic (every 30 seconds)
  useEffect(() => {
    if (!task || !normalizedData) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      const hasChanges =
        JSON.stringify(answers) !==
        JSON.stringify(lastSavedAnswersRef.current);

      if (hasChanges && Object.keys(answers).length > 0) {
        handleAutoSave();
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [answers, task, normalizedData]);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (!task || !normalizedData || isSubmitting) return;

    try {
      setAutoSaveStatus("saving");

      // Convert answers to API format
      const answersArray = Object.entries(answers).map(([questionId, answerData]) => ({
        question_id: questionId,
        answer_data: answerData,
      }));

      await authAxios.post("/submissions/save-draft/", {
        task: task.id,
        answers: answersArray,
      });

      lastSavedAnswersRef.current = { ...answers };
      setAutoSaveStatus("saved");

      // Reset status after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus("error");
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 3000);
    }
  }, [answers, task, normalizedData, isSubmitting]);

  // Update answer for a question
  const updateAnswer = useCallback((questionId, answerData) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: answerData,
    }));
  }, []);

  // Navigate to section
  const goToSection = useCallback((sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < (normalizedData?.sections?.length || 0)) {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
    }
  }, [normalizedData]);

  // Navigate to question
  const goToQuestion = useCallback((sectionIndex, questionIndex) => {
    if (
      sectionIndex >= 0 &&
      sectionIndex < (normalizedData?.sections?.length || 0)
    ) {
      const section = normalizedData.sections[sectionIndex];
      if (
        questionIndex >= 0 &&
        questionIndex < (section?.questions?.length || 0)
      ) {
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(questionIndex);
      }
    }
  }, [normalizedData]);

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    if (!normalizedData?.sections) return null;
    const section = normalizedData.sections[currentSectionIndex];
    if (!section?.questions) return null;
    return section.questions[currentQuestionIndex] || null;
  }, [normalizedData, currentSectionIndex, currentQuestionIndex]);

  // Get answer for a question
  const getAnswer = useCallback(
    (questionId) => {
      return answers[String(questionId)] || {};
    },
    [answers]
  );

  // Count answered questions
  const getAnsweredCount = useCallback(() => {
    return Object.keys(answers).filter((qId) => {
      const answer = answers[qId];
      if (!answer || typeof answer !== "object") return false;
      
      // Check if answer has any non-empty value
      const hasValue = Object.values(answer).some((val) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "string") return val.trim().length > 0;
        if (typeof val === "object" && val !== null) {
          return Object.keys(val).length > 0;
        }
        return Boolean(val);
      });
      
      return hasValue;
    }).length;
  }, [answers]);

  // Final submission
  const handleFinalSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (!task || !normalizedData || isSubmitting) return;

      const totalQuestions = normalizedData.totalQuestions || 0;
      const answeredCount = getAnsweredCount();
      const unansweredCount = totalQuestions - answeredCount;

      // Show confirmation if not auto-submit and there are unanswered questions
      if (!isAutoSubmit && unansweredCount > 0) {
        // This will be handled by the parent component with a modal
        return { needsConfirmation: true, unansweredCount };
      }

      try {
        setIsSubmitting(true);

        // Convert answers to API format
        const answersArray = Object.entries(answers).map(
          ([questionId, answerData]) => ({
            question_id: questionId,
            answer_data: answerData,
          })
        );

        // Submit final submission
        await authAxios.post("/submissions/", {
          task_id: task.id,
          answers: answersArray,
        });

        toast.success(
          intl.formatMessage({ id: "Submission successful!" })
        );

        // Redirect to my tasks
        router.push("/dashboard/my-tasks");
        return { success: true };
      } catch (error) {
        console.error("Submission error:", error);
        const errorMsg =
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          intl.formatMessage({ id: "Failed to submit. Please try again." });
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [task, normalizedData, answers, isSubmitting, getAnsweredCount, router, intl]
  );

  // Format time remaining as MM:SS
  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return {
    // State
    answers,
    currentSectionIndex,
    currentQuestionIndex,
    timeRemaining,
    isTimeUp,
    autoSaveStatus,
    isSubmitting,

    // Methods
    updateAnswer,
    goToSection,
    goToQuestion,
    getCurrentQuestion,
    getAnswer,
    getAnsweredCount,
    handleAutoSave,
    handleFinalSubmit,
    formatTime,
  };
}

