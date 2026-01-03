import React from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";

export default function ListeningQuestionLayout({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  partSummaries,
  activePartIndex,
  questionsInActivePart,
  renderQuestionTextWithInlineAnswers,
  onBackToSections,
  handlePartChange,
  onPrevious,
  onNext,
  mock,
}) {
  const intl = useIntl();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 flex flex-col gap-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {intl.formatMessage(
                    {
                      id: "Listening question {num} of {total}",
                      defaultMessage: "Listening question {num} of {total}",
                    },
                    { num: currentQuestionIndex + 1, total: totalQuestions }
                  )}
                </h2>
                {currentQuestion.groupType && (
                  <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {currentQuestion.groupType}
                  </span>
                )}
              </div>
              {currentQuestion.groupInstruction && (
                <p className="text-sm text-blue-700 mt-2 bg-blue-50 inline-block px-3 py-1.5 rounded-xl border border-blue-100">
                  {currentQuestion.groupInstruction}
                </p>
              )}
            </div>

            <button
              onClick={onBackToSections}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 rounded-xl transition text-sm font-semibold text-gray-700"
              aria-label={intl.formatMessage({
                id: "Back to sections",
                defaultMessage: "Back to sections",
              })}
            >
              <ArrowLeft className="w-4 h-4" />
              {intl.formatMessage({ id: "Back", defaultMessage: "Back" })}
            </button>
          </div>

          {partSummaries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {partSummaries.map((part) => {
                const isActive = part.partIndex === activePartIndex;
                return (
                  <button
                    key={part.partIndex}
                    onClick={() => handlePartChange(part.partIndex)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-800 border-buttonGrey hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {intl.formatMessage(
                          { id: "Part {num}", defaultMessage: "Part {num}" },
                          { num: part.partNumber }
                        )}
                      </span>
                      <span className="text-xs opacity-80">
                        {part.answered}/{part.questionCount}
                      </span>
                    </div>
                    <p className="text-xs leading-tight opacity-80 mt-1">
                      {part.title}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <Volume2 className="w-6 h-6 text-blue-600" />
          <audio
            controls
            className="flex-1 h-10"
            src={currentQuestion.audio_file || mock?.audio_file}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          {currentQuestion.groupImage && (
            <div className="mb-6">
              <img
                src={currentQuestion.groupImage}
                alt="Question Group"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none text-gray-900 leading-relaxed">
            {questionsInActivePart.map((question, idx) => (
              <p key={question.id} className="mb-5 text-base">
                {renderQuestionTextWithInlineAnswers(question)}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 px-6 md:px-10 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={onPrevious}
            disabled={activePartIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-buttonGrey rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            {intl.formatMessage({
              id: "Previous Part",
              defaultMessage: "Previous Part",
            })}
          </button>

          <div className="text-sm font-semibold text-gray-600">
            {intl.formatMessage(
              {
                id: "Part {num} / {total}",
                defaultMessage: "Part {num} / {total}",
              },
              { num: activePartIndex + 1, total: partSummaries.length }
            )}
          </div>

          <button
            onClick={onNext}
            disabled={activePartIndex === partSummaries.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
          >
            {intl.formatMessage({
              id: "Next Part",
              defaultMessage: "Next Part",
            })}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
