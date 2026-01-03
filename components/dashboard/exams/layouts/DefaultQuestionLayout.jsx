import React from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";

export default function DefaultQuestionLayout({
  sectionType,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  currentAnswer,
  answerWidth,
  splitRef,
  renderQuestionText,
  renderGapOptions,
  getChoiceOptions,
  formatOptionLabel,
  handleAnswerChange,
  handleDragStart,
  onBackToSections,
  onPrevious,
  onNext,
}) {
  const intl = useIntl();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900">
              {sectionType} -
              {intl.formatMessage(
                {
                  id: "Question {num} of {total}",
                  defaultMessage: " Question {num} of {total}",
                },
                { num: currentQuestionIndex + 1, total: totalQuestions }
              )}
            </h2>

            {currentQuestion.groupType && (
              <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {currentQuestion.groupType}
              </span>
            )}
          </div>
          {currentQuestion.partNumber && (
            <p className="text-sm text-gray-600 mt-1">
              {intl.formatMessage(
                { id: "Part {num}", defaultMessage: "Part {num}" },
                {
                  num:
                    typeof currentQuestion.partNumber === "string"
                      ? currentQuestion.partNumber
                      : currentQuestion.partNumber,
                }
              )}
            </p>
          )}
          {currentQuestion.passageTitle && (
            <p className="text-sm text-gray-600 mt-1">
              {typeof currentQuestion.passageTitle === "string"
                ? currentQuestion.passageTitle
                : ""}
            </p>
          )}
          {currentQuestion.groupInstruction && (
            <p className="text-sm text-blue-700 mt-2 bg-blue-50 inline-block px-3 py-1 rounded-md border border-blue-100">
              {currentQuestion.groupInstruction}
            </p>
          )}
        </div>
        <button
          onClick={onBackToSections}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition text-sm font-medium text-gray-700"
          aria-label={intl.formatMessage({
            id: "Back to sections",
            defaultMessage: "Back to sections",
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          {intl.formatMessage({ id: "Back", defaultMessage: "Back" })}
        </button>
      </div>

      <div
        ref={splitRef}
        className="flex-1 overflow-hidden flex items-stretch relative"
      >
        <div className="flex-1 bg-white border-r border-gray-100 p-5 overflow-y-auto">
          {sectionType === "LISTENING" && currentQuestion.audio_file && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                <audio
                  controls
                  className="flex-1 h-8"
                  src={currentQuestion.audio_file}
                />
              </div>
            </div>
          )}

          {currentQuestion.groupImage && (
            <div className="mb-6">
              <img
                src={currentQuestion.groupImage}
                alt="Question"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {currentQuestion.passageImage && (
            <div className="mb-6">
              <img
                src={currentQuestion.passageImage}
                alt="Passage"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {currentQuestion.passageText && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {typeof currentQuestion.passageText === "string"
                  ? currentQuestion.passageText
                  : ""}
              </p>
            </div>
          )}

          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {intl.formatMessage(
                { id: "Question {num}", defaultMessage: "Question {num}" },
                { num: currentQuestion.question_number }
              )}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {renderQuestionText(currentQuestion, currentAnswer) || ""}
            </p>

            {renderGapOptions(currentQuestion.metadata)}
          </div>

          {currentQuestion.metadata &&
            typeof currentQuestion.metadata === "string" && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                {currentQuestion.metadata}
              </div>
            )}
        </div>

        <div
          onMouseDown={handleDragStart}
          className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label={intl.formatMessage({
            id: "Resize answer panel",
            defaultMessage: "Resize answer panel",
          })}
        />

        <div
          className="bg-gray-50 p-5 border-l border-gray-100 flex-shrink-0 min-w-[200px] max-w-[900px] overflow-y-auto"
          style={{ width: `${answerWidth}px` }}
        >
          <h4 className="font-semibold text-gray-900 mb-4 text-sm">
            {intl.formatMessage({
              id: "Your Answer",
              defaultMessage: "Your Answer",
            })}
          </h4>

          {(() => {
            const { options, isChoice } = getChoiceOptions(currentQuestion);

            if (isChoice) {
              return (
                <div className="space-y-1.5">
                  {options.map((option, idx) => {
                    const value =
                      typeof option === "string"
                        ? option
                        : option.value ??
                          option.label ??
                          option.text ??
                          option.description;
                    const label = formatOptionLabel(option);

                    return (
                      <label
                        key={`${currentQuestion.id}-${idx}-${value}`}
                        className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition hover:bg-white"
                        style={{
                          borderColor:
                            currentAnswer === value ? "#3b82f6" : "#e5e7eb",
                          backgroundColor:
                            currentAnswer === value ? "#eff6ff" : "#f9fafb",
                        }}
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={value}
                          checked={currentAnswer === value}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
                        />
                        <span className="ml-3 text-gray-700 text-sm">
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            }

            return (
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={intl.formatMessage({
                  id: "Type your answer here",
                  defaultMessage: "Type your answer here...",
                })}
                className="w-full h-36 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
            );
          })()}

          {currentAnswer && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium">
                ✓{" "}
                {intl.formatMessage({
                  id: "Answered",
                  defaultMessage: "Answered",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 px-5 py-3 flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {intl.formatMessage({ id: "Previous", defaultMessage: "Previous" })}
        </button>

        <div className="text-xs font-medium text-gray-600">
          {intl.formatMessage(
            { id: "Q {num} / {total}", defaultMessage: "Q {num} / {total}" },
            { num: currentQuestionIndex + 1, total: totalQuestions }
          )}
        </div>

        <button
          onClick={onNext}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {intl.formatMessage({ id: "Next", defaultMessage: "Next" })}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
