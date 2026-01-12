import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { useIntl } from "react-intl";
import TiptapQuestionRenderer from "../tiptap-question-renderer";

const WritingQuestionLayout = memo(function WritingQuestionLayout({
  currentGroup,
  currentQuestionIndex,
  answers,
  onAnswerChange,
  focusQuestionNumber,
}) {
  const intl = useIntl();
  const editorRef = useRef(null);
  const prevQuestionIndexRef = useRef(currentQuestionIndex);
  const [leftWidth, setLeftWidth] = useState(48); // percent

  const handleDragStart = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = leftWidth;

      const onMove = (ev) => {
        const delta = ev.clientX - startX;
        const viewportWidth = window.innerWidth || 1;
        const deltaPercent = (delta / viewportWidth) * 100;
        const next = Math.min(75, Math.max(25, startWidth + deltaPercent));
        setLeftWidth(next);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [leftWidth]
  );

  // Focus specific question when triggered externally
  useEffect(() => {
    if (focusQuestionNumber && editorRef.current) {
      editorRef.current.focusQuestion(focusQuestionNumber);
    }
  }, [focusQuestionNumber]);
  // Track currentQuestionIndex to avoid stale comparisons (no auto-focus here)
  useEffect(() => {
    prevQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  const writingText =
    currentGroup?.task_text ||
    currentGroup?.taskText ||
    currentGroup?.prompt ||
    currentGroup?.description ||
    currentGroup?.passageText ||
    "";

  const writingTitle =
    currentGroup?.task_title ||
    currentGroup?.title ||
    intl.formatMessage({
      id: "Writing Task",
      defaultMessage: "Writing Task",
    });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white px-4 sm:px-6 md:px-10 py-8 flex justify-center">
        <div className="max-w-6xl w-full">
          {currentGroup?.groupInstruction && (
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-gray-700">
                {currentGroup.groupInstruction}
              </p>
            </div>
          )}

          <div
            className="flex flex-col gap-6 lg:flex-row lg:items-stretch"
            style={{ "--split-left-width": `${leftWidth}%` }}
          >
            {/* Prompt on the left */}
            <div
              className="space-y-4 w-full lg:w-[var(--split-left-width)] lg:min-w-[25%] lg:max-w-[75%]"
            >
              {currentGroup?.image && (
                <div>
                  <img
                    src={currentGroup.image}
                    alt="Question Diagram"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
              {writingText && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 max-h-[26rem] overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    {writingTitle}
                  </h4>
                  <div
                    className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: writingText }}
                  />
                </div>
              )}
            </div>

            {/* Drag handle */}
            <div
              onMouseDown={handleDragStart}
              className="hidden lg:block self-stretch w-2 bg-gray-300 hover:bg-blue-400 cursor-col-resize rounded"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panels"
            />

            {/* Answer textarea, image and template on the right */}
            <div className="space-y-4 w-full lg:flex-1 lg:min-w-[30%]">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  {intl.formatMessage({
                    id: "Your Answer",
                    defaultMessage: "Your Answer",
                  })}
                </h4>
                <textarea
                  rows={14}
                  className="w-full p-3 border border-gray-300 rounded-md text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none resize-vertical"
                  placeholder={intl.formatMessage({
                    id: "Type your essay here...",
                    defaultMessage: "Type your essay here...",
                  })}
                  value={answers?.[currentGroup?.task_number] || ""}
                  onChange={(e) =>
                    onAnswerChange?.(currentGroup?.task_number, e.target.value)
                  }
                />
                {currentGroup?.min_words && (
                  <div className="mt-2 text-xs text-gray-600">
                    {intl.formatMessage({
                      id: "Word count",
                      defaultMessage: "Word count",
                    })}
                    :{" "}
                    {
                      String(answers?.[currentGroup?.task_number] || "")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{" "}
                    / {currentGroup.min_words}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default WritingQuestionLayout;
