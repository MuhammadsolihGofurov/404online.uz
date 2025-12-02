/**
 * examUtils.js - Utility functions for exam engine
 * Pure functions that don't cause re-renders
 */

/**
 * Count answered questions from answers object
 * @param {Object} answers - Answers object { questionId: answerData }
 * @param {Array} allQuestions - All questions from normalized data
 * @returns {number} Count of answered questions
 */
export function countAnsweredQuestions(answers, allQuestions = []) {
  if (!answers || !allQuestions.length) return 0;

  let count = 0;
  const questionMap = {};

  // Build question map once
  allQuestions.forEach((q) => {
    questionMap[String(q.id)] = q;
  });

  Object.keys(answers).forEach((qId) => {
    const answer = answers[qId];
    if (!answer || typeof answer !== 'object') return;

    const question = questionMap[qId];
    const isGrouped =
      question &&
      question.question_number_end &&
      question.question_number_end > question.question_number_start;

    if (isGrouped && answer.values) {
      // Grouped question - count answered sub-questions
      const answeredSubQuestions = Object.keys(answer.values).filter((key) => {
        const val = answer.values[key];
        return val && String(val).trim().length > 0;
      }).length;
      count += answeredSubQuestions;
    } else {
      // Single question - check if any value is non-empty
      const hasValue = Object.values(answer).some((val) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim().length > 0;
        if (typeof val === 'object' && val !== null) {
          if (Object.keys(val).length === 0) return false;
          return Object.values(val).some(
            (subVal) => subVal && String(subVal).trim().length > 0,
          );
        }
        return Boolean(val);
      });

      if (hasValue) count += 1;
    }
  });

  return count;
}

/**
 * Format seconds into MM:SS format
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (seconds === null || seconds < 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Check if answers have changed (deep comparison optimization)
 * @param {Object} answers1 - First answers object
 * @param {Object} answers2 - Second answers object
 * @returns {boolean} True if different
 */
export function answersHaveChanged(answers1, answers2) {
  const keys1 = Object.keys(answers1 || {});
  const keys2 = Object.keys(answers2 || {});

  if (keys1.length !== keys2.length) return true;

  // Quick comparison using JSON stringify (cached in V8)
  try {
    return JSON.stringify(answers1) !== JSON.stringify(answers2);
  } catch (error) {
    console.error('Error comparing answers:', error);
    return true;
  }
}

/**
 * Calculate exam duration in seconds
 * @param {Object} task - Task object
 * @returns {number|null} Duration in seconds or null
 */
export function calculateExamDuration(task) {
  if (!task) return null;

  // Priority 1: duration_minutes
  if (task.duration_minutes && task.duration_minutes > 0) {
    return task.duration_minutes * 60;
  }

  // Priority 2: time window (end_time - now)
  if (task.end_time && task.start_time) {
    const endTime = new Date(task.end_time);
    const now = new Date();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  }

  // Priority 3: custom content time limit
  if (task.custom_content?.time_limit_minutes) {
    return task.custom_content.time_limit_minutes * 60;
  }

  return null;
}
