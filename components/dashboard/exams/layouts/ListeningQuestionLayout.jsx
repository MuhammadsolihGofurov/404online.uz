import React, { useRef, useEffect, useCallback, memo } from "react";
import { useIntl } from "react-intl";
import TiptapQuestionRenderer from "../tiptap-question-renderer";
import AudioPlayer from "../audio-player";

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

  // Focus first question only when group actually changes (not when focusQuestionNumber changes)
  useEffect(() => {
    // Only auto-focus if the question index actually changed and we're not manually focusing
    if (
      prevQuestionIndexRef.current !== currentQuestionIndex &&
      !focusQuestionNumber &&
      currentGroup?.questionNumbers?.[0] &&
      editorRef.current
    ) {
      editorRef.current.focusQuestion(currentGroup.questionNumbers[0]);
    }
    prevQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex, currentGroup?.questionNumbers]);

  // Calculate total questions across all groups
  const totalQuestions = partSummaries.reduce(
    (sum, part) => sum + part.questionCount,
    0
  );

  return (
    <div className="flex flex-col h-full">
      <AudioPlayer
        audioSrc={currentGroup?.audio_file || mock?.audio_file}
        allowControls={isPractice}
        isPractice={isPractice}
      />

      <div className="flex-1 bg-white px-6 md:px-10 py-8 flex justify-center">
        <div className="max-w-6xl w-full">
          {/* Render all question groups in the active part */}
          {groupsInActivePart.map((group, index) => {
            // Check if this is a map labeling question
            const isMapLabeling = group.groupInstruction
              ?.toLowerCase()
              .includes("map labeling");

            return (
              <div key={group.groupId} className="mb-12">
                {/* Don't show groupImage for map labeling since it's in the diagram */}
                {group.groupImage && !isMapLabeling && (
                  <div className="mb-6">
                    <img
                      src={group.groupImage}
                      alt="Question Group"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {group.groupInstruction && (
                  <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      {group.groupInstruction}
                    </p>
                  </div>
                )}

                <div className="max-w-none text-gray-900 leading-relaxed text-lg">
                  {group.template ? (
                    (() => {
                      // Check if template already uses the new drag-drop format
                      const isNewDragDropFormat =
                        group.template.includes(
                          "drag-drop-summary-container"
                        ) || group.template.includes("word-bank");

                      // Check if this is a map labeling question (old format or new format)
                      if (
                        (isMapLabeling || isNewDragDropFormat) &&
                        group.questionNumbers &&
                        group.questionNumbers.length > 0
                      ) {
                        // If it's already the new format, just render it
                        if (isNewDragDropFormat) {
                          return (
                            <TiptapQuestionRenderer
                              ref={index === 0 ? editorRef : null}
                              content={group.template}
                              answers={answers}
                              onAnswerChange={onAnswerChange}
                              hideInputs={true}
                            />
                          );
                        }

                        // Old format: Use groupImage directly (prioritize it over template image)
                        const imgSrc =
                          group.groupImage ||
                          (() => {
                            // Fallback: extract image src from template if groupImage not available
                            const imgMatch = group.template.match(
                              /<img[^>]+src="([^"]+)"/
                            );
                            return imgMatch ? imgMatch[1] : "";
                          })();

                        // Generate A-E options (or more if needed)
                        const optionCount = 5; // A-E
                        const dragOptions = Array.from(
                          { length: optionCount },
                          (_, i) => String.fromCharCode(65 + i)
                        );

                        // Generate labels positioned below the image (we'll show them as a grid)
                        const labels = group.questionNumbers.map(
                          (num, index) => ({
                            number: num,
                            x: 0, // Not used for grid layout
                            y: 0, // Not used for grid layout
                          })
                        );

                        // Create diagram-block template
                        const diagramTemplate = `
                        <diagram-block 
                          src="${imgSrc}"
                          labels='${JSON.stringify(labels)}'
                          dragOptions='${JSON.stringify(dragOptions)}'
                        ></diagram-block>
                      `;

                        return (
                          <TiptapQuestionRenderer
                            ref={index === 0 ? editorRef : null}
                            content={diagramTemplate}
                            answers={answers}
                            onAnswerChange={onAnswerChange}
                            hideInputs={true}
                          />
                        );
                      }

                      // Check if this is a matching question
                      const isMatching =
                        group.groupType === "MATCHING" ||
                        group.question_type === "MATCHING";

                      if (
                        isMatching &&
                        group.questionNumbers &&
                        group.questionNumbers.length > 0
                      ) {
                        // Extract options from template
                        const optionsMatch = group.template.match(
                          /<div class="matching-options-box">([^<]+)<\/div>/
                        );
                        let dragOptions = [];

                        if (optionsMatch) {
                          // Parse options from "A. Too difficult B. Very interesting C. Not practical"
                          // or "A. Too difficult\nB. Very interesting\nC. Not practical"
                          const optionsText = optionsMatch[1];

                          // Try splitting by newline first, then by space+letter pattern if needed
                          let parts = optionsText.split("\n");
                          if (parts.length === 1) {
                            // Single line format: split by space+capital letter pattern
                            parts = optionsText.match(/[A-Z]\.[^A-Z]*/g) || [];
                          }

                          dragOptions = parts
                            .map((opt) => opt.trim())
                            .filter((opt) => opt.length > 0)
                            .map((opt) => {
                              // Extract just the letter (A, B, C, etc.)
                              const letterMatch = opt.match(/^([A-Z])\./);
                              return letterMatch
                                ? letterMatch[1]
                                : opt.charAt(0);
                            });
                        }

                        // Create enhanced template with drag options
                        const dragOptionsJson = JSON.stringify(dragOptions);
                        const enhancedTemplate = group.template.replace(
                          /<div class="matching-options-box">([^<]+)<\/div>/,
                          `<matching-drag-options options='${dragOptionsJson}'></matching-drag-options><div class="matching-options-box">$1</div>`
                        );

                        return (
                          <TiptapQuestionRenderer
                            ref={index === 0 ? editorRef : null}
                            content={enhancedTemplate}
                            answers={answers}
                            onAnswerChange={onAnswerChange}
                            hideInputs={true}
                          />
                        );
                      }

                      // Regular template rendering
                      return (
                        <TiptapQuestionRenderer
                          ref={index === 0 ? editorRef : null}
                          content={group.template}
                          answers={answers}
                          onAnswerChange={onAnswerChange}
                          hideInputs={true}
                        />
                      );
                    })()
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
