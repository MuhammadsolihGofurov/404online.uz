import React from "react";
import { useIntl } from "react-intl";
import { CheckCircle, RotateCcw, X } from "lucide-react";

/**
 * TaskCompletionModal
 * 
 * Displays completion confirmation for non-EXAM_MOCK tasks (PRACTICE_MOCK, CUSTOM_MOCK, QUIZ).
 * Shows submission success and offers "Try Again" (replay) or "Back to Dashboard" options.
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onRetry - Callback when "Try Again" is clicked
 * @param {Function} onExit - Callback when "Back to Dashboard" is clicked
 * @param {Object} submission - Submission object (optional, for showing scores)
 * @param {Object} task - Task object (to check hide_results_from_student)
 */
export function TaskCompletionModal({ isOpen, onRetry, onExit, submission = null, task = null }) {
  const intl = useIntl();

  if (!isOpen) return null;

  const hideResults = task?.hide_results_from_student === true;
  const showScores = !hideResults && submission;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex justify-center py-10"
      onClick={onExit}
    >
      <div
        className="bg-white rounded-2xl relative shadow-lg max-w-md w-full mx-4 p-6 sm:p-8 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onExit}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {intl.formatMessage({ id: "Task Submitted Successfully!" })}
          </h2>
          <p className="text-sm text-gray-600">
            {intl.formatMessage({ id: "Your submission has been received and will be reviewed." })}
          </p>
        </div>

        {/* Scores (if visible) */}
        {showScores && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              {submission.raw_score !== null && submission.raw_score !== undefined && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">
                    {intl.formatMessage({ id: "Raw Score" })}
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {submission.raw_score}
                  </p>
                </div>
              )}
              {submission.band_score !== null && submission.band_score !== undefined && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">
                    {intl.formatMessage({ id: "Band Score" })}
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {submission.band_score}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message if results are hidden */}
        {hideResults && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800 text-center">
              {intl.formatMessage({ id: "Results will be available after teacher review." })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onRetry}
            className="w-full px-6 py-3 rounded-xl bg-main text-white hover:bg-main/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            {intl.formatMessage({ id: "Try Again" })}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
            {intl.formatMessage({ id: "Back to Dashboard" })}
          </button>
        </div>
      </div>
    </div>
  );
}

