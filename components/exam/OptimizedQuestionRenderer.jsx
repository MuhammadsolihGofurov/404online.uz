import React, { memo, useCallback } from 'react';
import { QuestionRenderer } from './question-renderer';

/**
 * Deep equality check for answer values
 * Properly compares objects without creating new strings every render
 */
function areValuesEqual(prev, next) {
  if (prev === next) return true;
  if (!prev && !next) return true;
  if (!prev || !next) return false;
  
  // Handle different question types
  if (typeof prev !== typeof next) return false;
  if (typeof prev !== 'object') return prev === next;
  
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    const prevVal = prev[key];
    const nextVal = next[key];
    
    if (typeof prevVal === 'object' && typeof nextVal === 'object') {
      return JSON.stringify(prevVal) === JSON.stringify(nextVal);
    }
    return prevVal === nextVal;
  });
}

/**
 * OptimizedQuestionRenderer - Prevents unnecessary re-renders
 * 
 * PERFORMANCE FIX:
 * - Memoizes onChange callback with useCallback
 * - Uses proper deep equality check instead of JSON.stringify
 * - Prevents parent re-renders from affecting child components
 * - Stable function reference across renders
 */
export const OptimizedQuestionRenderer = memo(({ 
  question, 
  value, 
  onAnswerUpdate, 
  disabled 
}) => {
  // Create stable onChange callback
  const handleChange = useCallback((answerData) => {
    onAnswerUpdate(question.id, answerData);
  }, [question.id, onAnswerUpdate]);

  return (
    <QuestionRenderer
      question={question}
      value={value}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - returns TRUE if props are equal (no re-render needed)
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.disabled === nextProps.disabled &&
    areValuesEqual(prevProps.value, nextProps.value) &&
    prevProps.onAnswerUpdate === nextProps.onAnswerUpdate
  );
});

OptimizedQuestionRenderer.displayName = 'OptimizedQuestionRenderer';
