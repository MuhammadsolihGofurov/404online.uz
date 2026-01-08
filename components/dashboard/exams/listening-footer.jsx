import React from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ListeningFooter({
  partSummaries,
  activePartIndex,
  currentQuestionNumber,
  answers,
  questionNumberToIndexMap,
  onPartChange,
  onStepPart, // kept for backward compatibility (unused for arrows)
  onQuestionSelect,
}) {
  const intl = useIntl();

  // Flatten all question numbers across parts in order
  const allQuestionNumbers = React.useMemo(() => {
    return partSummaries
      .flatMap((p) =>
        Array.isArray(p.questionNumbers) ? p.questionNumbers : []
      )
      .filter((n) => n !== null && n !== undefined);
  }, [partSummaries]);

  const currentIndex = React.useMemo(() => {
    if (!currentQuestionNumber) return -1;
    return allQuestionNumbers.indexOf(currentQuestionNumber);
  }, [allQuestionNumbers, currentQuestionNumber]);

  const getPartIndexForQuestion = (qNum) => {
    const part = partSummaries.find((p) => p.questionNumbers?.includes(qNum));
    return part ? part.partIndex : undefined;
  };

  const stepQuestion = (delta) => {
    if (currentIndex < 0) return;
    const nextIndex = Math.min(
      allQuestionNumbers.length - 1,
      Math.max(0, currentIndex + delta)
    );
    const qNum = allQuestionNumbers[nextIndex];
    const targetIndex = getTargetIndexForQuestion(qNum);
    const partIndex = getPartIndexForQuestion(qNum);
    if (typeof targetIndex === "number") {
      onQuestionSelect?.(targetIndex, partIndex, qNum);
    }
  };

  // Use the correct questionNumberToIndex map from exam-question
  const getTargetIndexForQuestion = (qNum) => {
    if (
      questionNumberToIndexMap &&
      questionNumberToIndexMap[qNum] !== undefined
    ) {
      return questionNumberToIndexMap[qNum];
    }
    return undefined;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-2">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => stepQuestion(-1)}
            disabled={currentIndex <= 0}
            className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={intl.formatMessage({
              id: "Previous question",
              defaultMessage: "Previous question",
            })}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-stretch gap-2 min-w-0">
            {partSummaries.map((part) => {
              const isActive = part.partIndex === activePartIndex;

              const partLabel = intl.formatMessage(
                { id: "Part {num}", defaultMessage: "Part {num}" },
                { num: part.partNumber }
              );

              const showTitle =
                part.title && part.title.trim() && part.title !== partLabel;

              return (
                <div
                  key={part.partIndex}
                  className={`flex flex-col min-w-[160px] px-3 py-2 rounded-lg border shadow-sm transition-all ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                      : "bg-gray-50 text-gray-800 border-buttonGrey hover:bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() => onPartChange(part.partIndex)}
                    className="w-full text-left"
                    title={part.title}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wide">
                      {partLabel}
                    </div>

                    {showTitle && (
                      <p className="text-xs font-semibold truncate mt-0.5">
                        {part.title}
                      </p>
                    )}
                  </button>

                  {isActive && part.questionNumbers && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {part.questionNumbers.map((qNum) => {
                        const answerValue =
                          answers[qNum] || answers[String(qNum)];
                        const isAnswered = Boolean(
                          answerValue && String(answerValue).trim()
                        );
                        const targetIndex = getTargetIndexForQuestion(qNum);

                        return (
                          <button
                            key={qNum}
                            onClick={() => {
                              if (typeof targetIndex === "number") {
                                onQuestionSelect(
                                  targetIndex,
                                  part.partIndex,
                                  qNum
                                );
                              }
                            }}
                            className={`px-2 py-1 rounded-md border text-xs font-semibold transition relative ${
                              isAnswered
                                ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                                : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                            }`}
                            aria-label={intl.formatMessage(
                              {
                                id: "Question {num}",
                                defaultMessage: "Question {num}",
                              },
                              { num: qNum }
                            )}
                          >
                            {qNum}
                            {isAnswered && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => stepQuestion(1)}
            disabled={currentIndex === allQuestionNumbers.length - 1}
            className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={intl.formatMessage({
              id: "Next question",
              defaultMessage: "Next question",
            })}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
