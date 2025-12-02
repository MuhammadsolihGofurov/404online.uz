import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { authAxios } from '@/utils/axios';
import { toast } from 'react-toastify';
import { useIntl } from 'react-intl';
import { useDebounce } from './useDebounce';
import {
  countAnsweredQuestions,
  formatTime,
  answersHaveChanged,
  calculateExamDuration,
} from '@/utils/examUtils';

/**
 * useExamEngine - OPTIMIZED VERSION
 *
 * Custom hook to manage exam state, timer, auto-save, and submission.
 * Handles both EXAM (Tasks) and PRACTICE (Training Zone) modes.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Debounced answer updates (300ms) to reduce re-renders
 * 2. Memoized expensive calculations (getAnsweredCount)
 * 3. Stable callback references with useCallback
 * 4. Separated auto-save logic from answer updates
 * 5. Refs for values that don't need to trigger renders
 */
export function useExamEngine(
  task,
  normalizedData,
  existingDraft,
  mode = 'exam',
  templateId = null,
  onSubmissionCreated = null,
) {
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
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  const autoSaveTimerRef = useRef(null);
  const lastSavedAnswersRef = useRef({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OPTIMIZATION: Use ref for pending answers to avoid re-renders on every keystroke
  const pendingAnswersRef = useRef({});

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

  // Create initial draft immediately on exam start (if no existing draft)
  // This ensures submissionId is set right away, enabling useExamStatus polling
  useEffect(() => {
    if (!task || !normalizedData || mode === 'practice') return;
    if (existingDraft?.id) return; // Already have a draft

    // Create empty draft immediately to get submission ID
    const createInitialDraft = async () => {
      try {
        const response = await authAxios.post('/submissions/save-draft/', {
          task: task.id,
          answers: [], // Empty answers for now
        });

        if (response.data?.id && onSubmissionCreated) {
          onSubmissionCreated(response.data.id);
        }
      } catch (error) {
        console.error('Failed to create initial draft:', error);
        // Don't show error toast - this is a background operation
      }
    };

    createInitialDraft();
  }, [task, normalizedData, mode, existingDraft, onSubmissionCreated]);

  // OPTIMIZATION: Initialize timer with persistence - memoize duration calculation
  useEffect(() => {
    if (!task || mode === 'practice') return; // No timer persistence for practice mode

    const storageKey = `exam_start_timestamp_${task.id}`;
    const durationSeconds = calculateExamDuration(task);

    if (!durationSeconds || durationSeconds <= 0) {
      return; // No timer for this task
    }

    // Check if exam was already started (persisted in localStorage)
    const savedStartTimestamp = localStorage.getItem(storageKey);
    const now = Date.now();
    let startTimestamp = null;

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
    [answers],
  );

  // OPTIMIZATION: Memoize answered count to avoid expensive recalculation on every render
  const answeredCount = useMemo(() => {
    return countAnsweredQuestions(answers, normalizedData?.allQuestions || []);
  }, [answers, normalizedData?.allQuestions]);

  // Getter function for backward compatibility
  const getAnsweredCount = useCallback(() => {
    return answeredCount;
  }, [answeredCount]);

  // OPTIMIZATION: Stable auto-save function that doesn't depend on answers state
  const handleAutoSaveInternal = useCallback(
    async (answersToSave) => {
      if (!task || !normalizedData || isSubmitting) return;

      try {
        setAutoSaveStatus('saving');

        const answersArray = Object.entries(answersToSave).map(
          ([questionId, answerData]) => ({
            question_id: questionId,
            answer_data: answerData,
          }),
        );

        const response = await authAxios.post('/submissions/save-draft/', {
          task: task.id,
          answers: answersArray,
        });

        if (response.data?.id && onSubmissionCreated) {
          onSubmissionCreated(response.data.id);
        }

        lastSavedAnswersRef.current = { ...answersToSave };
        setAutoSaveStatus('saved');

        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setAutoSaveStatus('error');
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3000);
      }
    },
    [task, normalizedData, isSubmitting, onSubmissionCreated],
  );

  // Public auto-save function - uses current answers state
  const handleAutoSave = useCallback(async () => {
    await handleAutoSaveInternal(answers);
  }, [handleAutoSaveInternal, answers]);

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
          }),
        );

        // =================================================
        // 🎯 TRAINING ZONE (Self-Check) Logic
        // =================================================
        if (mode === 'practice') {
          let response;

          // Scenario 1: Template Practice (Training Zone)
          // Calls /material-templates/{id}/self-check/
          if (templateId) {
            response = await authAxios.post(
              `/material-templates/${templateId}/self-check/`,
              {
                answers: answersArray,
              },
            );
          }
          // Scenario 2: Assigned Task Practice
          // Calls /tasks/{id}/practice-check/
          else if (task.task_type === 'PRACTICE_MOCK') {
            response = await authAxios.post(
              `/tasks/${task.id}/practice-check/`,
              {
                answers: answersArray,
              },
            );
          } else {
            throw new Error(
              'Practice mode configuration error: Missing templateId or invalid task type',
            );
          }

          toast.success(intl.formatMessage({ id: 'Practice check complete!' }));

          return {
            success: true,
            isPractice: true,
            results: response.data, // Contains band_score, detailed_results, etc.
            questions:
              normalizedData?.sections?.flatMap((s) => s.questions || []) || [],
          };
        }

        // =================================================
        // 📝 STANDARD EXAM SUBMISSION
        // =================================================
        const response = await authAxios.post('/submissions/', {
          task_id: task.id,
          answers: answersArray,
        });

        toast.success(intl.formatMessage({ id: 'Submission successful!' }));

        if (task?.id) {
          const storageKey = `exam_start_timestamp_${task.id}`;
          localStorage.removeItem(storageKey);
        }

        // Handle Assigned Practice Mocks (PRACTICE_MOCK)
        // Show results immediately instead of redirecting
        if (task.task_type === 'PRACTICE_MOCK') {
          const submission = response.data;

          // Parse feedback for section scores if available
          // Format: "Listening: 6.5 | Reading: 7.0"
          let section_scores = {};
          if (submission.feedback) {
            const parts = submission.feedback.split('|');
            parts.forEach((part) => {
              const [key, val] = part.split(':').map((s) => s.trim());
              if (key && val) {
                section_scores[key.toUpperCase()] = parseFloat(val);
              }
            });
          }

          return {
            success: true,
            isPractice: true,
            results: {
              band_score: submission.band_score,
              correct_answers: submission.raw_score,
              total_questions: totalQuestions,
              // Calculate accuracy if possible
              accuracy_percentage:
                totalQuestions > 0
                  ? (submission.raw_score / totalQuestions) * 100
                  : 0,
              section_scores: section_scores,
              // Standard submission doesn't return detailed_results yet
              detailed_results: [],
              message: intl.formatMessage({ id: 'Practice task completed.' }),
            },
            questions:
              normalizedData?.sections?.flatMap((s) => s.questions || []) || [],
          };
        }

        if (task.task_type === 'EXAM_MOCK') {
          router.push('/dashboard/my-tasks');
          return { success: true, isPractice: false, shouldRedirect: true };
        }

        return {
          success: true,
          isPractice: false,
          shouldRedirect: false,
          submission: response.data,
        };
      } catch (error) {
        console.error('Submission error:', error);
        const errorMsg =
          error?.response?.data?.detail ||
          'Failed to submit. Please try again.';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      task,
      normalizedData,
      answers,
      isSubmitting,
      getAnsweredCount,
      router,
      intl,
      mode,
      templateId,
    ],
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
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [mode, task, isSubmitting]);

  // OPTIMIZATION: Auto-save interval (30s) - stable, doesn't depend on answers
  useEffect(() => {
    if (!task || !normalizedData || mode === 'practice') return;

    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setInterval(() => {
      // Get current answers from state closure
      setAnswers((currentAnswers) => {
        // Check if there are changes
        const hasChanges = answersHaveChanged(
          currentAnswers,
          lastSavedAnswersRef.current,
        );

        if (hasChanges && Object.keys(currentAnswers).length > 0) {
          // Trigger save asynchronously without blocking
          handleAutoSaveInternal(currentAnswers);
        }

        // Return unchanged state (no re-render)
        return currentAnswers;
      });
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [task, normalizedData, mode, handleAutoSaveInternal]); // Removed 'answers' dependency!

  // OPTIMIZATION: Immediate update for UI responsiveness
  const updateAnswerImmediate = useCallback((questionId, answerData) => {
    const qId = String(questionId);
    // Update pending ref immediately (no re-render)
    pendingAnswersRef.current[qId] = answerData;
    // Update state immediately for UI
    setAnswers((prev) => ({ ...prev, [qId]: answerData }));
  }, []);

  // OPTIMIZATION: Debounced version for auto-save trigger (300ms delay)
  const updateAnswerDebounced = useDebounce((questionId, answerData) => {
    // This will only run after user stops typing for 300ms
    const qId = String(questionId);
    pendingAnswersRef.current[qId] = answerData;
  }, 300);

  // Main update function - combines immediate UI update with debounced logic
  const updateAnswer = useCallback(
    (questionId, answerData) => {
      updateAnswerImmediate(questionId, answerData);
      updateAnswerDebounced(questionId, answerData);
    },
    [updateAnswerImmediate, updateAnswerDebounced],
  );

  const goToSection = useCallback(
    (sectionIndex) => {
      if (
        sectionIndex >= 0 &&
        sectionIndex < (normalizedData?.sections?.length || 0)
      ) {
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(0);
      }
    },
    [normalizedData],
  );

  const goToQuestion = useCallback(
    (sectionIndex, questionIndex) => {
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
    },
    [normalizedData],
  );

  const getCurrentQuestion = useCallback(() => {
    if (!normalizedData?.sections) return null;
    const section = normalizedData.sections[currentSectionIndex];
    if (!section?.questions) return null;
    return section.questions[currentQuestionIndex] || null;
  }, [normalizedData, currentSectionIndex, currentQuestionIndex]);

  // OPTIMIZATION: Use utility function directly (no callback needed)
  const formatTimeFunc = formatTime;

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
    formatTime: formatTimeFunc,
  };
}
