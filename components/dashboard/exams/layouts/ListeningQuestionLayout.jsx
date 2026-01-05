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
          {currentGroup?.groupImage && (
            <div className="mb-6">
              <img
                src={currentGroup.groupImage}
                alt="Question Group"
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
              />
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
    </div>
  );
});

export default ListeningQuestionLayout;
