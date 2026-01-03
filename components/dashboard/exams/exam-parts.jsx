import React from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

export default function ExamParts({
  parts = [],
  currentPartIndex = 0,
  onPartChange = () => {},
  onSubmit = () => {},
  answersProgress = {},
  isSubmitting = false,
}) {
  const intl = useIntl();

  const getPartProgress = (partIndex) => {
    const part = parts[partIndex];
    if (!part || !part.question_count) return 0;

    let answered = 0;
    // This assumes answers are indexed by question id in the part
    Object.values(answersProgress).forEach((answer) => {
      if (answer) answered++;
    });

    return Math.round((answered / part.question_count) * 100);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      {/* Parts Navigation */}
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {intl.formatMessage({
              id: "Exam Parts",
              defaultMessage: "Exam Parts",
            })}
          </h3>
          <div className="text-xs text-gray-500">
            {intl.formatMessage(
              {
                id: "Part {current} of {total}",
                defaultMessage: "Part {current} of {total}",
              },
              { current: currentPartIndex + 1, total: parts.length }
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
          {/* Previous Button */}
          <button
            onClick={() => onPartChange(Math.max(0, currentPartIndex - 1))}
            disabled={currentPartIndex === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Part Tabs */}
          <div className="flex items-center gap-2">
            {parts.map((part, index) => {
              const progress = getPartProgress(index);
              const isActive = index === currentPartIndex;

              return (
                <button
                  key={part.id}
                  onClick={() => onPartChange(index)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title={part.title || part.name}
                >
                  <span className="text-xs truncate max-w-[100px]">
                    {part.title || part.name}
                  </span>
                  {progress > 0 && (
                    <div className="w-12 h-1 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isActive ? "bg-white" : "bg-blue-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() =>
              onPartChange(Math.min(parts.length - 1, currentPartIndex + 1))
            }
            disabled={currentPartIndex === parts.length - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={() => onSubmit()}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
          >
            <Send size={18} />
            {isSubmitting
              ? intl.formatMessage({
                  id: "Submitting...",
                  defaultMessage: "Submitting...",
                })
              : intl.formatMessage({
                  id: "Submit Exam",
                  defaultMessage: "Submit Exam",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
