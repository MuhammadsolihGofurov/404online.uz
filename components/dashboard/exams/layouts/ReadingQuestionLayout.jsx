import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { useIntl } from "react-intl";
import TiptapQuestionRenderer from "../tiptap-question-renderer";

const ReadingQuestionLayout = memo(function ReadingQuestionLayout({
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
            {/* Passage / reading text on the left */}
            <div
              className="space-y-4 w-full lg:w-[var(--split-left-width)] lg:min-w-[25%] lg:max-w-[75%]"
            >
              {currentGroup?.passageText && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[18rem] overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    {currentGroup.passageTitle ||
                      intl.formatMessage({
                        id: "Reading Passage",
                        defaultMessage: "Reading Passage",
                      })}
                  </h4>
                  <div
                    className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: currentGroup.passageText,
                    }}
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

            {/* Questions / template on the right */}
            <div className="space-y-4 w-full lg:flex-1 lg:min-w-[30%]">
              {currentGroup?.groupImage && (
                <div>
                  <img
                    src={currentGroup.groupImage}
                    alt="Question Group"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {currentGroup?.image && (
                <div>
                  <img
                    src={currentGroup.image}
                    alt="Question Diagram"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="max-w-none text-gray-900 leading-relaxed text-lg">
                {currentGroup?.template ? (
                  <TiptapQuestionRenderer
                    ref={editorRef}
                    content={currentGroup.template}
                    answers={answers}
                    onAnswerChange={onAnswerChange}
                    hideInputs={false}
                  />
                ) : (
                  <p className="text-gray-400 italic">
                    {intl.formatMessage({
                      id: "No template available",
                      defaultMessage:
                        "No template available for this question.",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReadingQuestionLayout;
