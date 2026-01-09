import React, { useMemo, useRef, useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";
import { Input, Select } from "@/components/custom/details";
import { ANSWER_PANEL, SECTION_TYPES } from "@/utils/examConstants";
import { extractQuestionNumbers } from "@/utils/templateRenderer";
import ListeningQuestionLayout from "./layouts/ListeningQuestionLayout";
import DefaultQuestionLayout from "./layouts/DefaultQuestionLayout";
import ReadingQuestionLayout from "./layouts/ReadingQuestionLayout";
import WritingQuestionLayout from "./layouts/WritingQuestionLayout";
import AudioPlayer from "./audio-player";

export default function ExamQuestion({
  mock,
  sectionType,
  currentQuestionIndex,
  answers,
  onAnswerChange,
  onNext,
  onPrevious,
  onSelectQuestion,
  onBackToSections,
  onPartSummariesChange,
  onPartChange,
  isPractice,
  activePartIndex: externalActivePartIndex,
  onQuestionIndexMapChange,
  onCurrentQuestionNumberChange,
  focusQuestionNumber,
}) {
  const intl = useIntl();
  const splitRef = useRef(null);
  const [answerWidth, setAnswerWidth] = useState(ANSWER_PANEL.DEFAULT_WIDTH);
  const answerMinWidth = ANSWER_PANEL.MIN_WIDTH;
  const answerMaxWidth = ANSWER_PANEL.MAX_WIDTH;

  // Use external prop directly instead of local state to avoid sync issues
  const activePartIndex = externalActivePartIndex ?? 0;

  // Stable audio source for listening section to prevent player resets
  const audioSrc = useMemo(() => mock?.audio_file, [mock?.audio_file]);

  // Flatten question_groups instead of individual questions
  // Each group now has a template with multiple questions embedded
  const flatQuestionGroups = useMemo(() => {
    const groups = [];

    if (sectionType === SECTION_TYPES.LISTENING && mock?.parts) {
      // Listening: flatten question_groups from parts
      mock.parts.forEach((part, partIndex) => {
        if (part.question_groups) {
          part.question_groups.forEach((group, groupIndex) => {
            groups.push({
              groupId: group.id || `group-${partIndex}-${groupIndex}`,
              partIndex,
              partNumber: part.part_number,
              groupIndex,
              groupType: group.question_type,
              groupInstruction: group.instruction,
              groupImage: group.image,
              template: group.template,
              audio_file: mock.audio_file,
              questions: group.questions || [],
              questionNumbers: extractQuestionNumbers(group.template || ""),
            });
          });
        }
      });
    } else if (sectionType === SECTION_TYPES.READING && mock?.passages) {
      // Reading: flatten question_groups from passages
      mock.passages.forEach((passage, passageIndex) => {
        if (passage.question_groups) {
          passage.question_groups.forEach((group, groupIndex) => {
            groups.push({
              groupId: group.id || `group-${passageIndex}-${groupIndex}`,
              passageIndex,
              passageTitle: passage.title,
              passageText: passage.text_content,
              passageImage: passage.image,
              groupIndex,
              groupType: group.group_type,
              groupInstruction: group.instruction,
              groupImage: group.image,
              template: group.template,
              displayText: group.display_text,
              commonOptions: group.common_options,
              questions: group.questions || [],
              questionNumbers: extractQuestionNumbers(group.template || ""),
            });
          });
        }
      });
    } else if (sectionType === SECTION_TYPES.WRITING && mock?.tasks) {
      // Writing: tasks remain as individual items (no template structure)
      mock.tasks.forEach((task, index) => {
        groups.push({
          groupId: task.id || `writing-${index}`,
          task_number: task.task_number || index + 1,
          taskIndex: index,
          partNumber: task.task_number || index + 1,
          groupType: "WRITING_TASK",
          template: task.template || "",
          ...task,
        });
      });
    }

    return groups;
  }, [mock, sectionType]);

  const currentGroup = flatQuestionGroups[currentQuestionIndex];

  // Get all question numbers across all groups for navigation
  const allQuestionNumbers = useMemo(() => {
    return flatQuestionGroups.flatMap((group) => group.questionNumbers || []);
  }, [flatQuestionGroups]);

  const questionNumberToIndex = useMemo(() => {
    const map = {};
    flatQuestionGroups.forEach((group, idx) => {
      (group.questionNumbers || []).forEach((num) => {
        if (map[num] === undefined) {
          map[num] = idx;
        }
      });
    });
    return map;
  }, [flatQuestionGroups]);

  const currentQuestionNumber =
    (currentGroup?.questionNumbers || [])[0] || null;

  useEffect(() => {
    if (onQuestionIndexMapChange) {
      onQuestionIndexMapChange(questionNumberToIndex);
    }
  }, [questionNumberToIndex, onQuestionIndexMapChange]);

  const totalQuestions = allQuestionNumbers.length;

  // Answer handler now uses question_number instead of question.id
  const handleAnswerChange = (questionNumber, value) => {
    onAnswerChange(questionNumber, value);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  const handleDragMove = (event) => {
    if (!splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const newWidth = rect.right - event.clientX;
    const clamped = Math.min(
      Math.max(newWidth, answerMinWidth),
      answerMaxWidth
    );
    setAnswerWidth(clamped);
  };

  const handleDragEnd = () => {
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  };

  const handleDragStart = (event) => {
    event.preventDefault();
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const partSummaries = useMemo(() => {
    // Listening uses parts, Reading uses passages
    const sourceParts =
      sectionType === SECTION_TYPES.LISTENING
        ? mock?.parts || []
        : sectionType === SECTION_TYPES.READING
        ? mock?.passages || []
        : sectionType === SECTION_TYPES.WRITING
        ? mock?.tasks || []
        : [];

    if (!sourceParts.length) return [];

    return sourceParts.map((part, partIndex) => {
      const groupsForPart = flatQuestionGroups.filter((g) =>
        sectionType === SECTION_TYPES.LISTENING
          ? g.partIndex === partIndex
          : sectionType === SECTION_TYPES.READING
          ? g.passageIndex === partIndex
          : g.taskIndex === partIndex
      );
      const firstIndex = flatQuestionGroups.findIndex((g) =>
        sectionType === SECTION_TYPES.LISTENING
          ? g.partIndex === partIndex
          : sectionType === SECTION_TYPES.READING
          ? g.passageIndex === partIndex
          : g.taskIndex === partIndex
      );

      // Count total questions and answered questions in this part
      const questionNumbers = Array.from(
        new Set(
          groupsForPart.flatMap((g) => g.questionNumbers || []).filter(Boolean)
        )
      ).sort((a, b) => a - b);
      const answeredCount = questionNumbers.filter(
        (num) => answers[num]
      ).length;

      return {
        partIndex,
        partNumber:
          part.part_number ||
          part.passage_number ||
          part.task_number ||
          partIndex + 1,
        title:
          part.title ||
          part.name ||
          (sectionType === SECTION_TYPES.WRITING
            ? intl.formatMessage({ id: "Task", defaultMessage: "Task" }) +
              " " +
              (part.task_number || partIndex + 1)
            : null) ||
          intl.formatMessage({ id: "Part", defaultMessage: "Part" }) +
            " " +
            (part.part_number ||
              part.passage_number ||
              part.task_number ||
              partIndex + 1),
        questionCount: questionNumbers.length,
        startIndex: firstIndex >= 0 ? firstIndex : null,
        answered: answeredCount,
        firstQuestion: questionNumbers[0] ?? null,
        lastQuestion:
          questionNumbers.length > 0
            ? questionNumbers[questionNumbers.length - 1]
            : null,
        questionNumbers,
      };
    });
  }, [sectionType, mock, answers, flatQuestionGroups, intl]);

  const groupsInActivePart = useMemo(() => {
    if (sectionType !== SECTION_TYPES.LISTENING) return [];
    return flatQuestionGroups.filter((g) => g.partIndex === activePartIndex);
  }, [flatQuestionGroups, sectionType, activePartIndex]);

  // Check if current group belongs to active part
  const currentGroupInActivePart = useMemo(() => {
    if (sectionType !== SECTION_TYPES.LISTENING) return true;
    return currentGroup?.partIndex === activePartIndex;
  }, [sectionType, currentGroup, activePartIndex]);

  // Send partSummaries and questionNumberToIndex to parent component for footer
  useEffect(() => {
    if (onPartSummariesChange) {
      onPartSummariesChange(
        partSummaries,
        activePartIndex,
        questionNumberToIndex
      );
    }
  }, [
    partSummaries,
    activePartIndex,
    questionNumberToIndex,
    onPartSummariesChange,
  ]);

  const handleQuestionJump = (index) => {
    if (onSelectQuestion) {
      onSelectQuestion(index);
    }
  };

  if (!currentGroup) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        {sectionType === SECTION_TYPES.LISTENING && (
          <AudioPlayer
            audioSrc={audioSrc}
            allowControls={isPractice}
            isPractice={isPractice}
          />
        )}
        <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{sectionType}</h2>
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
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-gray-900 font-semibold mb-2">
              {intl.formatMessage({
                id: "No questions available",
                defaultMessage: "No questions available",
              })}
            </p>
            <p className="text-gray-600 text-sm">
              {intl.formatMessage({
                id: "Please check back later or contact support",
                defaultMessage: "Please check back later or contact support.",
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sectionType === SECTION_TYPES.LISTENING) {
    // If current group doesn't belong to active part, show empty state
    if (!currentGroupInActivePart) {
      return (
        <div className="flex flex-col min-h-full bg-white">
          <AudioPlayer
            audioSrc={audioSrc}
            allowControls={isPractice}
            isPractice={isPractice}
          />
          <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {intl.formatMessage({ id: "Part", defaultMessage: "Part" })}{" "}
              {activePartIndex + 1}
            </h2>
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
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <p className="text-gray-900 font-semibold mb-2">
                {intl.formatMessage({
                  id: "No questions in this part",
                  defaultMessage: "No questions in this part",
                })}
              </p>
              <p className="text-gray-600 text-sm">
                {intl.formatMessage({
                  id: "This part doesn't have any questions yet",
                  defaultMessage: "This part doesn't have any questions yet.",
                })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-full">
        <AudioPlayer
          audioSrc={audioSrc}
          allowControls={isPractice}
          isPractice={isPractice}
        />
        <ListeningQuestionLayout
          currentGroup={currentGroup}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          partSummaries={partSummaries}
          activePartIndex={activePartIndex}
          groupsInActivePart={groupsInActivePart}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onBackToSections={onBackToSections}
          onPrevious={onPrevious}
          onNext={onNext}
          mock={mock}
          isPractice={isPractice}
          focusQuestionNumber={focusQuestionNumber}
        />
      </div>
    );
  }

  if (sectionType === SECTION_TYPES.READING) {
    return (
      <ReadingQuestionLayout
        currentGroup={currentGroup}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onBackToSections={onBackToSections}
        onPrevious={onPrevious}
        onNext={onNext}
        focusQuestionNumber={focusQuestionNumber}
      />
    );
  }

  if (sectionType === SECTION_TYPES.WRITING) {
    return (
      <WritingQuestionLayout
        currentGroup={currentGroup}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onBackToSections={onBackToSections}
        onPrevious={onPrevious}
        onNext={onNext}
        focusQuestionNumber={focusQuestionNumber}
      />
    );
  }

  return (
    <DefaultQuestionLayout
      sectionType={sectionType}
      currentGroup={currentGroup}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      answers={answers}
      answerWidth={answerWidth}
      splitRef={splitRef}
      onAnswerChange={handleAnswerChange}
      handleDragStart={handleDragStart}
      onBackToSections={onBackToSections}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  );
}
