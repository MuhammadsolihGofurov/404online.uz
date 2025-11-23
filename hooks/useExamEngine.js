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
 * @param {Object} task - Task object from API (or task-like object for templates)
 * @param {Object} normalizedData - Normalized exam data (sections, questions)
 * @param {Object} existingDraft - Existing draft submission (if any)
 * @param {string} mode - 'practice' for practice mode, 'exam' for normal submission (default: 'exam')
 * @param {string} templateId - Template ID for template practice mode (uses self_check endpoint)
 * @returns {Object} Exam engine state and methods
 */
export function useExamEngine(task, normalizedData, existingDraft, mode = 'exam', templateId = null) {
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

  // Initialize timer with persistence
  useEffect(() => {
    if (!task || mode === 'practice') return; // No timer persistence for practice mode

    const storageKey = `exam_start_timestamp_${task.id}`;
    let durationSeconds = null;
    let startTimestamp = null;

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

    if (!durationSeconds || durationSeconds <= 0) {
      return; // No timer for this task
    }

    // Check if exam was already started (persisted in localStorage)
    const savedStartTimestamp = localStorage.getItem(storageKey);
    const now = Date.now();

    if (savedStartTimestamp) {
      // Resume from saved timestamp
      startTimestamp = parseInt(savedStartTimestamp, 10);
      const elapsed = Math.floor((now - startTimestamp) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      
      if (remaining <= 0) {
        // Time is up, trigger auto-submit immediately
        setIsTimeUp(true);
        setTimeRemaining(0);
        // Clear storage
        localStorage.removeItem(storageKey);
        return;
      }
      
      setTimeRemaining(remaining);
    } else {
      // First time starting exam - save start timestamp
      startTimestamp = now;
      localStorage.setItem(storageKey, startTimestamp.toString());
      setTimeRemaining(durationSeconds);
    }

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          setIsTimeUp(true);
          // Clear storage when time is up
          localStorage.removeItem(storageKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [task, mode]);

  // Get answer for a question (needed by handleFinalSubmit)
  const getAnswer = useCallback(
    (questionId) => {
      return answers[String(questionId)] || {};
    },
    [answers]
  );

  // Count answered questions (needed by handleFinalSubmit)
  // For grouped questions, counts individual sub-questions
  const getAnsweredCount = useCallback(() => {
    let count = 0;
    
    // Get all questions to check for grouped questions
    const allQuestions = normalizedData?.allQuestions || [];
    const questionMap = {};
    allQuestions.forEach((q) => {
      questionMap[String(q.id)] = q;
    });
    
    Object.keys(answers).forEach((qId) => {
      const answer = answers[qId];
      if (!answer || typeof answer !== "object") return;
      
      const question = questionMap[qId];
      const isGrouped = question && question.question_number_end && 
                       question.question_number_end > question.question_number_start;
      
      if (isGrouped && answer.values) {
        // For grouped questions, count each answered sub-question
        const questionRange = question.question_number_end - question.question_number_start + 1;
        const answeredSubQuestions = Object.keys(answer.values).filter(
          (key) => answer.values[key] && String(answer.values[key]).trim().length > 0
        ).length;
        count += answeredSubQuestions;
      } else {
        // For single questions, check if answer has any non-empty value
        const hasValue = Object.values(answer).some((val) => {
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === "string") return val.trim().length > 0;
          if (typeof val === "object" && val !== null) {
            // Skip nested values object (handled above)
            if (Object.keys(val).length === 0) return false;
            // Check if it's a values object with actual answers
            return Object.values(val).some((subVal) => 
              subVal && String(subVal).trim().length > 0
            );
          }
          return Boolean(val);
        });
        
        if (hasValue) {
          count += 1;
        }
      }
    });
    
    return count;
  }, [answers, normalizedData]);

  // Auto-save function (needed by auto-save useEffect)
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

  // Final submission (or practice check) - MUST be defined before useEffect that uses it
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

        // Practice mode: Use practice-check or self-check endpoint
        if (mode === 'practice') {
          let response;
          
          // Template practice: Use self_check endpoint
          if (templateId) {
            response = await authAxios.post(`/material-templates/${templateId}/self-check/`, {
              answers: answersArray,
            });
          } 
          // Task practice: Use practice-check endpoint (only for PRACTICE_MOCK)
          else if (task.task_type === 'PRACTICE_MOCK') {
            response = await authAxios.post(`/tasks/${task.id}/practice-check/`, {
              answers: answersArray,
            });
          } else {
            throw new Error("Practice mode is only available for PRACTICE_MOCK tasks or templates");
          }

          toast.success(
            intl.formatMessage({ id: "Practice check complete!" })
          );

          // Return results for parent component to display
          return { 
            success: true, 
            isPractice: true,
            results: response.data,
            questions: normalizedData?.sections?.flatMap(s => s.questions || []) || []
          };
        }

        // Normal mode: Submit final submission
        const response = await authAxios.post("/submissions/", {
          task_id: task.id,
          answers: answersArray,
        });

        toast.success(
          intl.formatMessage({ id: "Submission successful!" })
        );

        // Clear exam timer storage on successful submission
        if (task?.id) {
          const storageKey = `exam_start_timestamp_${task.id}`;
          localStorage.removeItem(storageKey);
        }

        // EXAM_MOCK: Redirect immediately (strict mode, 1 attempt only)
        if (task.task_type === 'EXAM_MOCK') {
          router.push("/dashboard/my-tasks");
          return { success: true, isPractice: false, shouldRedirect: true };
        }

        // Non-EXAM tasks: Return submission data for modal display (replay workflow)
        return { 
          success: true, 
          isPractice: false, 
          shouldRedirect: false,
          submission: response.data 
        };
      } catch (error) {
        console.error("Submission error:", error);
        const errorMsg =
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          intl.formatMessage({ id: "Failed to submit. Please try again." });
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [task, normalizedData, answers, isSubmitting, getAnsweredCount, router, intl, mode, templateId]
  );

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && timeRemaining === 0 && !isSubmitting) {
      handleFinalSubmit(true); // auto-submit
    }
  }, [isTimeUp, timeRemaining, isSubmitting, handleFinalSubmit]);

  // Prevent accidental exit during exam (beforeunload warning)
  useEffect(() => {
    if (mode === 'exam' && task && !isSubmitting) {
      const handleBeforeUnload = (e) => {
        // Standard way to show browser warning
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for Safari
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [mode, task, isSubmitting]);

  // Auto-save logic (every 30 seconds) - Disabled in practice mode
  useEffect(() => {
    if (!task || !normalizedData || mode === 'practice') return;

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
  }, [answers, task, normalizedData, mode, handleAutoSave]);

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

