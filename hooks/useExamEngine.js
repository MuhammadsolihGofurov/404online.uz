import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";

/**
 * useExamEngine
 * 
 * Custom hook to manage exam state, timer, auto-save, and submission.
 * Handles both EXAM (Tasks) and PRACTICE (Training Zone) modes.
 */
export function useExamEngine(task, normalizedData, existingDraft, mode = 'exam', templateId = null, onSubmissionCreated = null) {
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
          localStorage.removeItem(storageKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [task, mode]);

  // Get answer for a question
  const getAnswer = useCallback(
    (questionId) => {
      return answers[String(questionId)] || {};
    },
    [answers]
  );

  // Count answered questions
  const getAnsweredCount = useCallback(() => {
    let count = 0;
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
        const answeredSubQuestions = Object.keys(answer.values).filter(
          (key) => answer.values[key] && String(answer.values[key]).trim().length > 0
        ).length;
        count += answeredSubQuestions;
      } else {
        const hasValue = Object.values(answer).some((val) => {
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === "string") return val.trim().length > 0;
          if (typeof val === "object" && val !== null) {
            if (Object.keys(val).length === 0) return false;
            return Object.values(val).some((subVal) => 
              subVal && String(subVal).trim().length > 0
            );
          }
          return Boolean(val);
        });
        
        if (hasValue) count += 1;
      }
    });
    
    return count;
  }, [answers, normalizedData]);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (!task || !normalizedData || isSubmitting) return;

    try {
      setAutoSaveStatus("saving");

      const answersArray = Object.entries(answers).map(([questionId, answerData]) => ({
        question_id: questionId,
        answer_data: answerData,
      }));

      const response = await authAxios.post("/submissions/save-draft/", {
        task: task.id,
        answers: answersArray,
      });

      if (response.data?.id && onSubmissionCreated) {
        onSubmissionCreated(response.data.id);
      }

      lastSavedAnswersRef.current = { ...answers };
      setAutoSaveStatus("saved");

      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus("error");
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 3000);
    }
  }, [answers, task, normalizedData, isSubmitting, onSubmissionCreated]);

  // Final submission (or practice check)
  const handleFinalSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (!task || !normalizedData || isSubmitting) return;

      const totalQuestions = normalizedData.totalQuestions || 0;
      const answeredCount = getAnsweredCount();
      const unansweredCount = totalQuestions - answeredCount;

      if (!isAutoSubmit && unansweredCount > 0) {
        return { needsConfirmation: true, unansweredCount };
      }

      try {
        setIsSubmitting(true);

        const answersArray = Object.entries(answers).map(
          ([questionId, answerData]) => ({
            question_id: questionId,
            answer_data: answerData,
          })
        );

        // =================================================
        // 🎯 TRAINING ZONE (Self-Check) Logic
        // =================================================
        if (mode === 'practice') {
          let response;
          
          // Scenario 1: Template Practice (Training Zone)
          // Calls /material-templates/{id}/self-check/
          if (templateId) {
            response = await authAxios.post(`/material-templates/${templateId}/self-check/`, {
              answers: answersArray,
            });
          } 
          // Scenario 2: Assigned Task Practice
          // Calls /tasks/{id}/practice-check/
          else if (task.task_type === 'PRACTICE_MOCK') {
            response = await authAxios.post(`/tasks/${task.id}/practice-check/`, {
              answers: answersArray,
            });
          } else {
            throw new Error("Practice mode configuration error: Missing templateId or invalid task type");
          }

          toast.success(intl.formatMessage({ id: "Practice check complete!" }));

          return { 
            success: true, 
            isPractice: true, 
            results: response.data, // Contains band_score, detailed_results, etc.
            questions: normalizedData?.sections?.flatMap(s => s.questions || []) || []
          };
        }

        // =================================================
        // 📝 STANDARD EXAM SUBMISSION
        // =================================================
        const response = await authAxios.post("/submissions/", {
          task_id: task.id,
          answers: answersArray,
        });

        toast.success(intl.formatMessage({ id: "Submission successful!" }));

        if (task?.id) {
          const storageKey = `exam_start_timestamp_${task.id}`;
          localStorage.removeItem(storageKey);
        }

        if (task.task_type === 'EXAM_MOCK') {
          router.push("/dashboard/my-tasks");
          return { success: true, isPractice: false, shouldRedirect: true };
        }

        return { 
          success: true, 
          isPractice: false, 
          shouldRedirect: false,
          submission: response.data 
        };
      } catch (error) {
        console.error("Submission error:", error);
        const errorMsg = error?.response?.data?.detail || "Failed to submit. Please try again.";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [task, normalizedData, answers, isSubmitting, getAnsweredCount, router, intl, mode, templateId]
  );

  // Auto-submit handler
  useEffect(() => {
    if (isTimeUp && timeRemaining === 0 && !isSubmitting) {
      handleFinalSubmit(true);
    }
  }, [isTimeUp, timeRemaining, isSubmitting, handleFinalSubmit]);

  // Prevent accidental exit
  useEffect(() => {
    if (mode === 'exam' && task && !isSubmitting) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [mode, task, isSubmitting]);

  // Auto-save interval (30s)
  useEffect(() => {
    if (!task || !normalizedData || mode === 'practice') return;
    
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setInterval(() => {
      const hasChanges = JSON.stringify(answers) !== JSON.stringify(lastSavedAnswersRef.current);
      if (hasChanges && Object.keys(answers).length > 0) {
        handleAutoSave();
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [answers, task, normalizedData, mode, handleAutoSave]);

  const updateAnswer = useCallback((questionId, answerData) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: answerData }));
  }, []);

  const goToSection = useCallback((sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < (normalizedData?.sections?.length || 0)) {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
    }
  }, [normalizedData]);

  const goToQuestion = useCallback((sectionIndex, questionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < (normalizedData?.sections?.length || 0)) {
      const section = normalizedData.sections[sectionIndex];
      if (questionIndex >= 0 && questionIndex < (section?.questions?.length || 0)) {
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(questionIndex);
      }
    }
  }, [normalizedData]);

  const getCurrentQuestion = useCallback(() => {
    if (!normalizedData?.sections) return null;
    const section = normalizedData.sections[currentSectionIndex];
    if (!section?.questions) return null;
    return section.questions[currentQuestionIndex] || null;
  }, [normalizedData, currentSectionIndex, currentQuestionIndex]);

  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return {
    answers,
    currentSectionIndex,
    currentQuestionIndex,
    timeRemaining,
    isTimeUp,
    autoSaveStatus,
    isSubmitting,
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
