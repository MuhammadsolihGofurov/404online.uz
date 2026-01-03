import React from "react";
import { useIntl } from "react-intl";
import { ChevronDown, Volume2 } from "lucide-react";

export default function ExamQuestions({
  questions = [],
  currentPartIndex = 0,
  parts = [],
  onAudioPlay = () => {},
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
    <div className="h-full overflow-y-auto bg-white">
      {/* Part Header */}
      {currentPart && (
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 z-10">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {currentPart.title || currentPart.name}
          </h2>
          {currentPart.description && (
            <p className="text-sm text-gray-600">{currentPart.description}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">
              {intl.formatMessage({
                id: "Questions",
                defaultMessage: "Questions",
              })}
              : {currentPart.question_count || questions.length}
            </span>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="p-6 space-y-6">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            {/* Question Number and Type */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-blue-600">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {question.question_type || "MCQ"}
                  </span>
                  {question.audio_url && (
                    <button
                      onClick={() => onAudioPlay(question.audio_url)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      title={intl.formatMessage({
                        id: "Play audio",
                        defaultMessage: "Play audio",
                      })}
                    >
                      <Volume2 size={14} />
                      {intl.formatMessage({
                        id: "Audio",
                        defaultMessage: "Audio",
                      })}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm font-medium text-gray-900 mb-4 ml-11">
              {question.question_text}
            </p>

            {/* Image if exists */}
            {question.image_url && (
              <div className="mb-4 ml-11">
                <img
                  src={question.image_url}
                  alt="Question"
                  className="max-w-full h-auto rounded border border-gray-200"
                />
              </div>
            )}

            {/* Options for MCQ */}
            {question.options && question.options.length > 0 && (
              <div className="ml-11 space-y-2">
                {question.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className="flex items-start gap-3 p-2 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-gray-600 min-w-fit">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <span className="text-sm text-gray-700">
                      {option.text || option}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Question Mark */}
            {question.mark && (
              <div className="mt-4 ml-11 text-xs text-gray-500 border-t border-gray-100 pt-2">
                {intl.formatMessage({
                  id: "Mark",
                  defaultMessage: "Mark",
                })}
                : <span className="font-semibold">{question.mark}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
