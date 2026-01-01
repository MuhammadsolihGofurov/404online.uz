import React from "react";
import { useIntl } from "react-intl";

export default function QuestionDisplay({ question, answer, onAnswerChange }) {
  const intl = useIntl();

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No question available</p>
      </div>
    );
  }

  const renderQuestionByType = () => {
    switch (question.question_type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  answer === option.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answer === option.id}
                  onChange={() => onAnswerChange(option.id)}
                  className="w-5 h-5 text-primary"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <div className="space-y-3">
            {["True", "False"].map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  answer === option
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={() => onAnswerChange(option)}
                  className="w-5 h-5 text-primary"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case "SHORT_ANSWER":
      case "FILL_IN_BLANK":
        return (
          <div>
            <textarea
              value={answer || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder={intl.formatMessage({
                id: "Type your answer here...",
                defaultMessage: "Type your answer here...",
              })}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none min-h-[120px] resize-y"
            />
          </div>
        );

      case "MATCHING":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Match the items by selecting the correct pairs
            </p>
            {question.matching_pairs?.map((pair, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  {pair.left}
                </div>
                <span className="text-gray-400">→</span>
                <select
                  value={answer?.[index] || ""}
                  onChange={(e) => {
                    const newAnswer = { ...answer, [index]: e.target.value };
                    onAnswerChange(newAnswer);
                  }}
                  className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="">Select...</option>
                  {question.right_options?.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Question type not supported: {question.question_type}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
      {/* Question text */}
      <div className="mb-8">
        {question.instruction && (
          <p className="text-sm text-gray-600 mb-4 italic">
            {question.instruction}
          </p>
        )}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {question.question_text}
        </h2>

        {/* Image if available */}
        {question.image && (
          <div className="mb-6">
            <img
              src={question.image}
              alt="Question"
              className="max-w-full h-auto rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Audio if available */}
        {question.audio && (
          <div className="mb-6">
            <audio controls className="w-full">
              <source src={question.audio} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      {/* Answer options */}
      {renderQuestionByType()}

      {/* Points indicator */}
      {question.points && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Points: <span className="font-semibold">{question.points}</span>
          </p>
        </div>
      )}
    </div>
  );
}
