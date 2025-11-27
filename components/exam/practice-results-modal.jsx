import React from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { Trophy, CheckCircle, XCircle, AlertCircle, RotateCcw, LogOut, X } from "lucide-react";
import { QuestionRendererReadOnly } from "./question-renderer-readonly";

/**
 * PracticeResultsModal
 * 
 * Displays instant scoring results from practice_check or self_check endpoints.
 * Shows accuracy, band score, and detailed question-by-question breakdown.
 */
export function PracticeResultsModal({ isOpen, onClose, results, questions = [], userAnswers = {}, deadline = null }) {
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

  // Check deadline logic
  const isDeadlinePassed = deadline ? new Date() > new Date(deadline) : false;

  const handleTryAgain = () => {
    if (isDeadlinePassed) return;
    onClose();
    // Reload the page to restart practice
    router.reload();
  };

  const handleFinishReview = () => {
    onClose();
    const { templateId } = router.query;
    
    // Logic to determine where to redirect
    // If templateId exists or path suggests template practice -> Training Zone
    if (templateId || router.pathname.includes("/practice/template")) {
      router.push("/dashboard/materials-hub?type=TRAINING_ZONE");
    } else {
      // Default fallback (Task Practice) -> My Tasks
      router.push("/dashboard/my-tasks");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex justify-center py-10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl relative shadow-2xl max-w-4xl w-full mx-4 p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {intl.formatMessage({ id: "Practice Results" })}
          </h2>
          {message && (
            <p className="text-gray-500 mt-2">{message}</p>
          )}
          {isDeadlinePassed && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm font-medium inline-block">
              <AlertCircle size={16} className="inline mr-2 -mt-0.5" />
              {intl.formatMessage({ id: "Deadline has passed. Restart is disabled." })}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Band Score (Highlighted) */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex flex-col items-center justify-center text-center md:col-span-1 col-span-2">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              {intl.formatMessage({ id: "IELTS Band Score" })}
            </p>
            <p className="text-4xl font-extrabold text-purple-700">
              {band_score !== null && band_score !== undefined ? band_score : "-"}
            </p>
          </div>

          {/* Accuracy */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              {intl.formatMessage({ id: "Accuracy" })}
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {accuracy_percentage.toFixed(0)}%
            </p>
          </div>

          {/* Correct Answers */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-100 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
              {intl.formatMessage({ id: "Correct" })}
            </p>
            <p className="text-2xl font-bold text-green-700">
              {correct_answers} <span className="text-base font-normal text-green-600">/ {total_questions}</span>
            </p>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
              {intl.formatMessage({ id: "Incorrect" })}
            </p>
            <p className="text-2xl font-bold text-red-700">
              {incorrect_answers}
            </p>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
            <CheckCircle size={16} />
            <span>{correct_answers} Correct</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-100">
            <XCircle size={16} />
            <span>{incorrect_answers} Incorrect</span>
          </div>
          {requires_manual_review > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100">
              <AlertCircle size={16} />
              <span>{requires_manual_review} Under Review</span>
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        {questionsWithResults.length > 0 && (
          <div className="mb-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Question Breakdown</span>
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {questionsWithResults.length} Questions
              </span>
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {questionsWithResults.map(({ question, result }) => {
                if (!result) return null;

                const isCorrect = result.is_correct === true;
                const isIncorrect = result.is_correct === false;
                const requiresReview = result.requires_review === true;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      isCorrect
                        ? "bg-green-50/50 border-green-100 hover:border-green-200"
                        : isIncorrect
                        ? "bg-red-50/50 border-red-100 hover:border-red-200"
                        : "bg-yellow-50/50 border-yellow-100 hover:border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isCorrect && <CheckCircle size={20} className="text-green-600" />}
                        {isIncorrect && <XCircle size={20} className="text-red-600" />}
                        {requiresReview && <AlertCircle size={20} className="text-yellow-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-800">
                            {intl.formatMessage(
                              { id: "Question {number}" },
                              { number: question.question_number || "?" }
                            )}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-500">
                            {question.question_type?.replace(/_/g, " ")}
                          </span>
                        </div>
                        
                        {/* Render question context and user answer (Read Only) */}
                        <QuestionRendererReadOnly
                          question={question}
                          userAnswer={userAnswer}
                          correctAnswer={null}
                          showCorrectness={true}
                        />
                        
                        {/* Feedback Message from Backend (if available) */}
                        {result.feedback && (
                          <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                            <span className="font-semibold">Feedback:</span> {result.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleTryAgain}
            disabled={isDeadlinePassed}
            className={`order-2 sm:order-1 px-6 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
              isDeadlinePassed 
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <RotateCcw size={18} />
            {intl.formatMessage({ id: "Retry / Restart" })}
          </button>
          
          <button
            type="button"
            onClick={handleFinishReview}
            className="order-1 sm:order-2 px-8 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-200 transform active:scale-95"
          >
            <LogOut size={18} />
            {intl.formatMessage({ id: "Submit & Exit" })}
          </button>
        </div>
      </div>
    </div>
  );
}
