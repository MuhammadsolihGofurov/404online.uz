import React from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { Trophy, CheckCircle, XCircle, AlertCircle, RotateCcw, X } from "lucide-react";
import { QuestionRendererReadOnly } from "./question-renderer-readonly";

/**
 * PracticeResultsModal
 * 
 * Displays instant scoring results from practice_check or self_check endpoints.
 * Shows accuracy, band score, and detailed question-by-question breakdown.
 */
export function PracticeResultsModal({ isOpen, onClose, results, questions = [], userAnswers = {} }) {
  const intl = useIntl();
  const router = useRouter();

  if (!isOpen || !results) return null;

  const {
    total_questions = 0,
    answered_questions = 0,
    correct_answers = 0,
    incorrect_answers = 0,
    requires_manual_review = 0,
    accuracy_percentage = 0,
    band_score = null,
    detailed_results = [],
    message = "",
  } = results;

  // Create a map of question_id -> detailed result for quick lookup
  const resultsMap = {};
  detailed_results.forEach((result) => {
    resultsMap[String(result.question_id)] = result;
  });

  // Find question objects for detailed display
  const questionsWithResults = questions.map((q) => {
    const result = resultsMap[String(q.id)];
    const userAnswer = userAnswers[String(q.id)] || null;
    return {
      question: q,
      result: result || null,
      userAnswer: userAnswer,
    };
  });

  const handleTryAgain = () => {
    onClose();
    // Reload the page to restart practice
    router.reload();
  };

  const handleExit = () => {
    onClose();
    // Navigate back to appropriate page
    if (router.pathname.includes("/practice/template")) {
      router.push("/dashboard/materials-hub?type=TRAINING_ZONE");
    } else {
      router.push("/dashboard/my-tasks");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex justify-center py-10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl relative shadow-lg max-w-4xl w-full mx-4 p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {intl.formatMessage({ id: "Practice Results" })}
            </h2>
          </div>
          {message && (
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Accuracy */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">
              {intl.formatMessage({ id: "Accuracy" })}
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {accuracy_percentage.toFixed(1)}%
            </p>
          </div>

          {/* Correct Answers */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-gray-600 mb-1">
              {intl.formatMessage({ id: "Correct" })}
            </p>
            <p className="text-2xl font-bold text-green-700">
              {correct_answers} / {total_questions}
            </p>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-xs text-gray-600 mb-1">
              {intl.formatMessage({ id: "Incorrect" })}
            </p>
            <p className="text-2xl font-bold text-red-700">
              {incorrect_answers}
            </p>
          </div>

          {/* Band Score */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">
              {intl.formatMessage({ id: "Band Score" })}
            </p>
            <p className="text-2xl font-bold text-purple-700">
              {band_score !== null && band_score !== undefined
                ? band_score
                : "-"}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-700">
                {intl.formatMessage(
                  { id: "{count} correct answers" },
                  { count: correct_answers }
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-600" />
              <span className="text-gray-700">
                {intl.formatMessage(
                  { id: "{count} incorrect answers" },
                  { count: incorrect_answers }
                )}
              </span>
            </div>
            {requires_manual_review > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-gray-700">
                  {intl.formatMessage(
                    { id: "{count} require review" },
                    { count: requires_manual_review }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        {questionsWithResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {intl.formatMessage({ id: "Question Breakdown" })}
            </h3>
            <div className="space-y-4">
              {questionsWithResults.map(({ question, result }) => {
                if (!result) return null;

                const isCorrect = result.is_correct === true;
                const isIncorrect = result.is_correct === false;
                const requiresReview = result.requires_review === true;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect
                        ? "bg-green-50 border-green-200"
                        : isIncorrect
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect && (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      {isIncorrect && (
                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      {requiresReview && (
                        <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {intl.formatMessage(
                              { id: "Question {number}" },
                              { number: question.question_number || "?" }
                            )}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                            {question.question_type?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <QuestionRendererReadOnly
                          question={question}
                          userAnswer={userAnswer}
                          correctAnswer={null} // Practice results don't include correct answers in detail
                          showCorrectness={true}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleExit}
            className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
            {intl.formatMessage({ id: "Exit" })}
          </button>
          <button
            type="button"
            onClick={handleTryAgain}
            className="px-6 py-2.5 rounded-xl bg-main text-white hover:bg-main/90 transition-colors font-medium flex items-center gap-2"
          >
            <RotateCcw size={18} />
            {intl.formatMessage({ id: "Try Again" })}
          </button>
        </div>
      </div>
    </div>
  );
}

