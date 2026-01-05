import React from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";
import { renderTemplate } from "@/utils/templateRenderer";

export default function DefaultQuestionLayout({
  sectionType,
  currentGroup,
  currentQuestionIndex,
  answers,
  answerWidth,
  splitRef,
  onAnswerChange,
  handleDragStart,
  onBackToSections,
  onPrevious,
  onNext,
}) {
  const intl = useIntl();

  // Calculate total question count (we no longer receive it as prop)
  const totalQuestions = currentGroup?.questionNumbers?.length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900">
              {sectionType} - Group {currentQuestionIndex + 1}
            </h2>

            {currentGroup?.groupType && (
              <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {currentGroup.groupType}
              </span>
            )}
          </div>
          {currentGroup?.partNumber && (
            <p className="text-sm text-gray-600 mt-1">
              {intl.formatMessage(
                { id: "Part {num}", defaultMessage: "Part {num}" },
                { num: currentGroup.partNumber }
              )}
            </p>
          )}
          {currentGroup?.passageTitle && (
            <p className="text-sm text-gray-600 mt-1">
              {currentGroup.passageTitle}
            </p>
          )}
          {currentGroup?.groupInstruction && (
            <p className="text-sm text-blue-700 mt-2 bg-blue-50 inline-block px-3 py-1 rounded-md border border-blue-100">
              {currentGroup.groupInstruction}
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
          {currentGroup?.groupImage && (
            <div className="mb-6">
              <img
                src={currentGroup.groupImage}
                alt="Question"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {currentGroup?.passageImage && (
            <div className="mb-6">
              <img
                src={currentGroup.passageImage}
                alt="Passage"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {currentGroup?.passageText && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                {currentGroup.passageTitle ||
                  intl.formatMessage({
                    id: "Reading Passage",
                    defaultMessage: "Reading Passage",
                  })}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {currentGroup.passageText}
              </p>
            </div>
          )}

          <div className="mb-5">
            <div className="prose prose-base max-w-none text-gray-900 leading-relaxed">
              {/* Render template with React components */}
              {currentGroup?.template ? (
                renderTemplate(currentGroup.template, answers, onAnswerChange)
              ) : (
                <p className="text-gray-400 italic">
                  {intl.formatMessage({
                    id: "No template available for this group",
                    defaultMessage: "No template available for this group",
                  })}
                </p>
              )}
            </div>
          </div>
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
              id: "Answer Panel",
              defaultMessage: "Answer Panel",
            })}
          </h4>

          <div className="space-y-3">
            {currentGroup?.questionNumbers?.map((num) => (
              <div
                key={num}
                className="p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {intl.formatMessage(
                      { id: "Q {num}", defaultMessage: "Q {num}" },
                      { num }
                    )}
                  </span>
                  {answers[num] && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  {answers[num] ? (
                    <span className="font-medium">{answers[num]}</span>
                  ) : (
                    <span className="italic text-gray-400">
                      {intl.formatMessage({
                        id: "Not answered",
                        defaultMessage: "Not answered",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              {intl.formatMessage({
                id: "Answered",
                defaultMessage: "Answered",
              })}
              :{" "}
              <span className="font-semibold">
                {currentGroup?.questionNumbers?.filter((num) => answers[num])
                  .length || 0}
                /{totalQuestions}
              </span>
            </p>
          </div>
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
            { id: "Group {num}", defaultMessage: "Group {num}" },
            { num: currentQuestionIndex + 1 }
          )}
        </div>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {intl.formatMessage({ id: "Next", defaultMessage: "Next" })}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
