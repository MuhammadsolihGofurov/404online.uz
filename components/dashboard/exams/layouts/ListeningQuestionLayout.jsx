import React, { useRef, useEffect, useCallback, memo } from "react";
import { useIntl } from "react-intl";
import TiptapQuestionRenderer from "../tiptap-question-renderer";

const ListeningQuestionLayout = memo(function ListeningQuestionLayout({
  currentGroup,
  currentQuestionIndex,
  partSummaries,
  activePartIndex,
  groupsInActivePart,
  answers,
  onAnswerChange,
  onBackToSections,
  handlePartChange,
  onPrevious,
  onNext,
  mock,
  isPractice,
  focusQuestionNumber,
}) {
  const intl = useIntl();
  const editorRef = useRef(null);
  const prevQuestionIndexRef = useRef(currentQuestionIndex);

  // Focus specific question when clicked from footer
  useEffect(() => {
    if (focusQuestionNumber && editorRef.current) {
      editorRef.current.focusQuestion(focusQuestionNumber);
    }
  }, [focusQuestionNumber]);
  // Track currentQuestionIndex to avoid stale comparisons (no auto-focus here)
  useEffect(() => {
    prevQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Calculate total questions across all groups
  const totalQuestions = partSummaries.reduce(
    (sum, part) => sum + part.questionCount,
    0
  );

  return (
    <div className="flex flex-col min-h-full py-4">
      <div className="flex-1 bg-white px-4 sm:px-6 md:px-10 py-8 flex justify-center">
        <div className="max-w-6xl w-full">
          {/* Render all question groups in the active part */}
          {groupsInActivePart.map((group, index) => {
            // Check if this is a map labeling question
            const isMapLabeling = group.groupInstruction
              ?.toLowerCase()
              .includes("map labeling");

            return (
              <div key={group.groupId} className="mb-12">
                {group.groupInstruction && (
                  <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      {group.groupInstruction}
                    </p>
                  </div>
                )}

                {/* Show group image or question image after instruction */}
                {group.groupImage && (
                  <div className="mb-6">
                    <img
                      src={group.groupImage}
                      alt="Question Group"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {group.image && (
                  <div className="mb-6">
                    <img
                      src={group.image}
                      alt="Question Diagram"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                <div className="max-w-none text-gray-900 leading-relaxed text-lg">
                  {group.template ? (
                    <TiptapQuestionRenderer
                      ref={index === 0 ? editorRef : null}
                      content={group.template}
                      answers={answers}
                      onAnswerChange={onAnswerChange}
                      hideInputs={true}
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
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ListeningQuestionLayout;
