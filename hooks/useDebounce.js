import { useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Debounce a callback function
 *
 * PERFORMANCE FIX: Returns stable function reference using useCallback
 * This prevents unnecessary re-renders in components that use this hook
 *
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function (stable reference)
 */
export function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // CRITICAL FIX: Use useCallback to return stable function reference
  // Only delay as dependency ensures function reference doesn't change unnecessarily
  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ); // Only recreate if delay changes
}
