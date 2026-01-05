import React, { useMemo, useRef, useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";
import { Input, Select } from "@/components/custom/details";
import { ANSWER_PANEL, SECTION_TYPES } from "@/utils/examConstants";
import { extractQuestionNumbers } from "@/utils/templateRenderer";
import ListeningQuestionLayout from "./layouts/ListeningQuestionLayout";
import DefaultQuestionLayout from "./layouts/DefaultQuestionLayout";

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
  const [activePartIndex, setActivePartIndex] = useState(
    externalActivePartIndex ?? 0
  );

  useEffect(() => {
    if (typeof externalActivePartIndex === "number") {
      setActivePartIndex(externalActivePartIndex);
    }
  }, [externalActivePartIndex]);

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

  useEffect(() => {
    if (onCurrentQuestionNumberChange) {
      onCurrentQuestionNumberChange(currentQuestionNumber);
    }
  }, [currentQuestionNumber, onCurrentQuestionNumberChange]);

  const totalQuestions = allQuestionNumbers.length;

  useEffect(() => {
    if (
      sectionType === SECTION_TYPES.LISTENING &&
      currentGroup?.partIndex >= 0
    ) {
      setActivePartIndex(currentGroup.partIndex);
    }
  }, [sectionType, currentGroup?.partIndex]);

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
    if (sectionType !== SECTION_TYPES.LISTENING || !mock?.parts) return [];

    return mock.parts.map((part, partIndex) => {
      const groupsForPart = flatQuestionGroups.filter(
        (g) => g.partIndex === partIndex
      );
      const firstIndex = flatQuestionGroups.findIndex(
        (g) => g.partIndex === partIndex
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
        partNumber: part.part_number || partIndex + 1,
        title:
          part.title ||
          part.name ||
          intl.formatMessage({ id: "Part", defaultMessage: "Part" }) +
            " " +
            (part.part_number || partIndex + 1),
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
  }, [sectionType, mock?.parts, flatQuestionGroups, answers, intl]);

  const groupsInActivePart = useMemo(() => {
    if (sectionType !== SECTION_TYPES.LISTENING) return [];
    return flatQuestionGroups.filter((g) => g.partIndex === activePartIndex);
  }, [flatQuestionGroups, sectionType, activePartIndex]);

  const handlePartChange = (nextPartIndex) => {
    setActivePartIndex(nextPartIndex);
    if (onPartChange) {
      onPartChange(nextPartIndex);
    }
  };

  // Send partSummaries to parent component for footer
  useEffect(() => {
    if (onPartSummariesChange) {
      onPartSummariesChange(partSummaries, activePartIndex);
    }
  }, [partSummaries, activePartIndex, onPartSummariesChange]);

  const handleQuestionJump = (index) => {
    if (onSelectQuestion) {
      onSelectQuestion(index);
    }
  };

  if (!currentGroup) {
    return (
      <div className="flex flex-col h-full bg-white">
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
    return (
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
        handlePartChange={handlePartChange}
        onPrevious={onPrevious}
        onNext={onNext}
        mock={mock}
        isPractice={isPractice}
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
