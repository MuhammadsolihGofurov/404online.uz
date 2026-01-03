import React from "react";
import { useIntl } from "react-intl";
import { Save, RotateCcw } from "lucide-react";

export default function ExamAnswers({
  questions = [],
  answers = {},
  onAnswerChange = () => {},
  onSaveDraft = () => {},
  currentPartIndex = 0,
  parts = [],
}) {
  const intl = useIntl();

  if (!questions || questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">
          {intl.formatMessage({
            id: "No questions available",
            defaultMessage: "No questions available",
          })}
        </p>
      </div>
    );
  }

  const currentPart = parts[currentPartIndex];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 flex flex-col">
      {/* Part Header */}
      {currentPart && (
        <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 p-4 z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {intl.formatMessage({
              id: "Your Answers",
              defaultMessage: "Your Answers",
            })}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {intl.formatMessage({
              id: "Enter your answers below",
              defaultMessage: "Enter your answers below",
            })}
          </p>
        </div>
      )}

      {/* Answers Input Area */}
      <div className="flex-1 p-6 space-y-5">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            {/* Question Reference */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-emerald-600">
                  {index + 1}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 flex-1">
                {intl.formatMessage({
                  id: "Question",
                  defaultMessage: "Question",
                })}{" "}
                {index + 1}
              </p>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  answers[question.id]
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {answers[question.id] ? "✓ Answered" : "Not answered"}
              </span>
            </div>

            {/* Answer Input */}
            <div className="space-y-3">
              {question.question_type === "ESSAY" ||
              question.question_type === "WRITING" ? (
                // Text Area for Writing Questions
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  placeholder={intl.formatMessage({
                    id: "Type your answer here...",
                    defaultMessage: "Type your answer here...",
                  })}
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              ) : (
                // MCQ Options
                <div className="space-y-2">
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={String.fromCharCode(65 + optIdx)}
                          checked={
                            answers[question.id] ===
                            String.fromCharCode(65 + optIdx)
                          }
                          onChange={(e) =>
                            onAnswerChange(question.id, e.target.value)
                          }
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">
                          <strong className="text-emerald-600 mr-2">
                            {String.fromCharCode(65 + optIdx)}.
                          </strong>
                          {option.text || option}
                        </span>
                      </label>
                    ))
                  ) : (
                    // Text Input for Short Answer
                    <input
                      type="text"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        onAnswerChange(question.id, e.target.value)
                      }
                      placeholder={intl.formatMessage({
                        id: "Enter your answer...",
                        defaultMessage: "Enter your answer...",
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <button
          onClick={() => onSaveDraft()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Save size={18} />
          {intl.formatMessage({
            id: "Save Draft",
            defaultMessage: "Save Draft",
          })}
        </button>
        <button
          onClick={() => {
            // Clear all answers for current part
            questions.forEach((q) => onAnswerChange(q.id, ""));
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
        >
          <RotateCcw size={18} />
          {intl.formatMessage({
            id: "Clear",
            defaultMessage: "Clear",
          })}
        </button>
      </div>
    </div>
  );
}
