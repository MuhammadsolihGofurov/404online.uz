import React, { useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useExamEngine } from "@/hooks/useExamEngine";
import { QuestionRenderer } from "./question-renderer";
import { PracticeResultsModal } from "./practice-results-modal";
import { toast } from "react-toastify";

/**
 * QuizRunner Component
 * 
 * Simplified interface for QUIZ type tasks.
 * Renders all questions in a vertical scrollable list without sections or audio player.
 */
export function QuizRunner({ task, normalizedData, existingDraft, onSubmissionComplete }) {
  const intl = useIntl();
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Initialize exam engine
  const {
    answers,
    updateAnswer,
    handleFinalSubmit,
    isSubmitting,
    getAnswer,
    getAnsweredCount,
  } = useExamEngine(task, normalizedData, existingDraft, 'exam');

  const handleSubmit = async () => {
    const totalQuestions = normalizedData?.totalQuestions || 0;
    const answeredCount = getAnsweredCount();
    
    if (answeredCount < totalQuestions) {
      if (!confirm(intl.formatMessage({ id: "You have unanswered questions. Submit anyway?" }))) {
        return;
      }
    }

    const result = await handleFinalSubmit(false);
    
    if (result?.success) {
      if (onSubmissionComplete) {
        onSubmissionComplete(result.submission);
      } else {
        // Show local results if no callback (fallback)
        // Note: Real quiz feedback usually comes from the backend submission response
        toast.success("Quiz submitted successfully!");
        router.push("/dashboard/my-tasks");
      }
    }
  };

  // Flatten all questions from all sections (Quizzes might have sections in data structure but UI is flat)
  const allQuestions = normalizedData?.sections?.flatMap(s => s.questions || []) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {allQuestions.length} {intl.formatMessage({ id: "questions" })}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/my-tasks")}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            {intl.formatMessage({ id: "Exit" })}
          </button>
        </div>

        {/* Question List */}
        <div className="space-y-6 mb-8">
          {allQuestions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                  {index + 1}
                </span>
                {/* Status Indicator if needed */}
              </div>
              
              <QuestionRenderer
                question={question}
                value={getAnswer(question.id)}
                onChange={(answerData) => updateAnswer(question.id, answerData)}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>

        {/* Submit Action */}
        <div className="sticky bottom-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{getAnsweredCount()}</span> / {allQuestions.length} {intl.formatMessage({ id: "answered" })}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {intl.formatMessage({ id: "Submitting..." })}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {intl.formatMessage({ id: "Submit Quiz" })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

