import React, { useMemo, useRef, useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ChevronLeft, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";
import { Input, Select } from "@/components/custom/details";
import { ANSWER_PANEL } from "@/utils/examConstants";
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
  totalQuestions,
}) {
  const intl = useIntl();
  const splitRef = useRef(null);
  const [answerWidth, setAnswerWidth] = useState(ANSWER_PANEL.DEFAULT_WIDTH);
  const answerMinWidth = ANSWER_PANEL.MIN_WIDTH;
  const answerMaxWidth = ANSWER_PANEL.MAX_WIDTH;
  const [activePartIndex, setActivePartIndex] = useState(0);
  const renderQuestionTextWithInlineAnswers = (question) => {
    const text = question?.text;
    const metadata = question?.metadata;

    if (!text || typeof text !== "string") return text;

    const { options, isChoice } = getChoiceOptions(question);
    const currentValue = answers[question.id] || "";

    const parts = [];
    let lastIndex = 0;
    const regex = /{{(.*?)}}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const key = match[1];
      if (lastIndex < match.index) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const gapMeta = metadata?.[key] || {};
      const label = gapMeta.placeholder || key.replace(/_/g, " ").toUpperCase();

      if (isChoice && options.length > 0) {
        // Render inline select dropdown for MCQ using Select component
        const selectOptions = options.map((option, idx) => {
          const optionValue =
            typeof option === "string"
              ? option
              : option.value ?? option.label ?? option.text ?? "";
          const optionLabel = formatOptionLabel(option);
          return {
            value: optionValue,
            label: optionLabel,
          };
        });

        parts.push(
          <span
            key={`${question.id}-${key}-${match.index}`}
            className="inline-block mx-2 align-middle min-w-[150px]"
          >
            <Select
              placeholder={label}
              options={selectOptions}
              value={currentValue}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          </span>
        );
      } else {
        // Render inline input for gap-fill using Input component
        parts.push(
          <span
            key={`${question.id}-${key}-${match.index}`}
            className="inline-block mx-2 align-middle min-w-[150px]"
          >
            <Input
              type="text"
              placeholder={label}
              name={`gap-${question.id}-${key}`}
              register={() => ({
                value: currentValue,
                onChange: (e) => onAnswerChange(question.id, e.target.value),
              })}
            />
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderQuestionText = (question, currentAnswerValue) => {
    const text = question?.text;
    const metadata = question?.metadata;

    if (!text || typeof text !== "string") return null;

    const { isChoice } = getChoiceOptions(question);

    const parts = [];
    let lastIndex = 0;
    const regex = /{{(.*?)}}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const key = match[1];
      if (lastIndex < match.index) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const gapMeta = metadata?.[key] || {};
      const label = gapMeta.placeholder || key.replace(/_/g, " ").toUpperCase();

      parts.push(
        <span
          key={`${key}-${match.index}`}
          className="inline-flex items-center px-2 py-1 mx-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
        >
          {label}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderGapOptions = (metadata) => {
    if (!metadata || typeof metadata !== "object") return null;

    const keys = Object.keys(metadata);
    if (keys.length !== 1) return null;

    const key = keys[0];
    const gapMeta = metadata[key];
    const options = gapMeta?.options;
    const isChoice = gapMeta?.type === "mcq" || gapMeta?.type === "dropdown";

    if (!isChoice || !Array.isArray(options) || options.length === 0)
      return null;

    return (
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          {intl.formatMessage({ id: "Options", defaultMessage: "Options" })}
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt, idx) => (
            <span
              key={`${idx}-${formatOptionLabel(opt)}`}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200"
            >
              {formatOptionLabel(opt)}
            </span>
          ))}
        </div>
      </div>
    );
  };
  const flatQuestions = useMemo(() => {
    const questions = [];

    if (sectionType === "LISTENING" && mock?.parts) {
      // Listening: flatten questions from parts and groups
      mock.parts.forEach((part, partIndex) => {
        if (part.question_groups) {
          part.question_groups.forEach((group, groupIndex) => {
            if (group.questions) {
              group.questions.forEach((question) => {
                questions.push({
                  ...question,
                  partIndex,
                  partNumber: part.part_number,
                  groupIndex,
                  groupType: group.question_type,
                  groupInstruction: group.instruction,
                  groupImage: group.image,
                  audio_file: mock.audio_file,
                  id:
                    question.id ||
                    `q-${partIndex}-${groupIndex}-${question.question_number}`,
                });
              });
            }
          });
        }
      });
    } else if (sectionType === "READING" && mock?.passages) {
      // Reading: flatten questions from passages and question groups
      mock.passages.forEach((passage, passageIndex) => {
        if (passage.question_groups) {
          passage.question_groups.forEach((group, groupIndex) => {
            if (group.questions) {
              group.questions.forEach((question) => {
                questions.push({
                  ...question,
                  passageIndex,
                  passageTitle: passage.title,
                  passageText: passage.text_content,
                  passageImage: passage.image,
                  groupIndex,
                  groupType: group.group_type,
                  groupInstruction: group.instruction,
                  groupImage: group.image,
                  displayText: group.display_text,
                  commonOptions: group.common_options,
                  id:
                    question.id ||
                    `q-${passageIndex}-${groupIndex}-${question.question_number}`,
                });
              });
            }
          });
        } else if (passage.questions) {
          // Fallback: direct questions on passage (old structure)
          passage.questions.forEach((question) => {
            questions.push({
              ...question,
              passageIndex,
              passageTitle: passage.title,
              passageText: passage.text_content,
              passageImage: passage.image,
              id:
                question.id || `q-${passageIndex}-${question.question_number}`,
            });
          });
        }
      });
    } else if (sectionType === "WRITING" && mock?.tasks) {
      // Writing: map writing tasks as questions
      mock.tasks.forEach((task, index) => {
        questions.push({
          ...task,
          id: task.id || `writing-${index}`,
          task_number: task.task_number || index + 1,
        });
      });
    }

    return questions;
  }, [mock, sectionType]);

  const currentQuestion = flatQuestions[currentQuestionIndex];

  useEffect(() => {
    if (sectionType === "LISTENING" && currentQuestion?.partIndex >= 0) {
      setActivePartIndex(currentQuestion.partIndex);
    }
  }, [sectionType, currentQuestion?.partIndex]);

  const handleAnswerChange = (answer) => {
    onAnswerChange(currentQuestion.id, answer);
  };

  const currentAnswer = answers[currentQuestion?.id] || "";

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
    if (sectionType !== "LISTENING" || !mock?.parts) return [];

    return mock.parts.map((part, partIndex) => {
      const questionsForPart = flatQuestions.filter(
        (q) => q.partIndex === partIndex
      );
      const firstIndex = flatQuestions.findIndex(
        (q) => q.partIndex === partIndex
      );

      return {
        partIndex,
        partNumber: part.part_number || partIndex + 1,
        title:
          part.title ||
          part.name ||
          intl.formatMessage({ id: "Part", defaultMessage: "Part" }) +
            " " +
            (part.part_number || partIndex + 1),
        questionCount: questionsForPart.length,
        startIndex: firstIndex >= 0 ? firstIndex : null,
        answered: questionsForPart.reduce((count, q) => {
          return answers[q.id] ? count + 1 : count;
        }, 0),
      };
    });
  }, [sectionType, mock?.parts, flatQuestions, answers, intl]);

  const questionsInActivePart = useMemo(() => {
    if (sectionType !== "LISTENING") return [];
    return flatQuestions.filter((q) => q.partIndex === activePartIndex);
  }, [flatQuestions, sectionType, activePartIndex]);

  const questionIndexById = useMemo(() => {
    const map = {};
    flatQuestions.forEach((q, index) => {
      map[q.id] = index;
    });
    return map;
  }, [flatQuestions]);

  const handlePartChange = (nextPartIndex) => {
    setActivePartIndex(nextPartIndex);
  };

  const handleQuestionJump = (index) => {
    if (onSelectQuestion) {
      onSelectQuestion(index);
    }
  };

  const getChoiceOptions = (question) => {
    if (!question) return { options: [], isChoice: false };
    // Priority 1: explicit options array on question
    if (Array.isArray(question.options) && question.options.length > 0) {
      return { options: question.options, isChoice: true };
    }

    // Priority 2: metadata-based options (mcq/dropdown)
    if (question.metadata && typeof question.metadata === "object") {
      const keys = Object.keys(question.metadata);
      const key = keys[0];
      const meta = key ? question.metadata[key] : null;
      const isChoice = meta?.type === "mcq" || meta?.type === "dropdown";
      const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
      return {
        options: metaOptions,
        isChoice: isChoice && metaOptions.length > 0,
      };
    }

    return { options: [], isChoice: false };
  };

  const formatOptionLabel = (option) => {
    if (typeof option === "string") return option;

    const label = option?.label ?? option?.value ?? "";
    const text = option?.text ?? option?.description ?? "";

    if (label && text) return `${label}) ${text}`;
    if (text) return text;
    return label;
  };

  if (!currentQuestion) {
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
            <p className="text-gray-600 text-sm mb-4">
              {intl.formatMessage(
                {
                  id: "DEBUG: Section {section}, Questions: {count}, Mock: {hasMock}",
                  defaultMessage:
                    "Section: {section}, Questions: {count}, Has Data: {hasMock}",
                },
                {
                  section: sectionType,
                  count: flatQuestions.length,
                  hasMock: !!mock,
                }
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderAnswerInput = (question) => {
    const { options, isChoice } = getChoiceOptions(question);
    const value = answers[question.id] || "";

    if (isChoice) {
      return (
        <div className="space-y-2">
          {options.map((option, idx) => {
            const optionValue =
              typeof option === "string"
                ? option
                : option.value ??
                  option.label ??
                  option.text ??
                  option.description;

            return (
              <label
                key={`${question.id}-${idx}-${optionValue}`}
                className="flex items-start gap-2 p-2 border rounded-lg cursor-pointer hover:bg-white transition"
              >
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="mt-0.5 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {formatOptionLabel(option)}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        placeholder={intl.formatMessage({
          id: "Enter answer",
          defaultMessage: "Enter answer",
        })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    );
  };

  if (sectionType === "LISTENING") {
    return (
      <ListeningQuestionLayout
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        partSummaries={partSummaries}
        activePartIndex={activePartIndex}
        questionsInActivePart={questionsInActivePart}
        renderQuestionTextWithInlineAnswers={
          renderQuestionTextWithInlineAnswers
        }
        onBackToSections={onBackToSections}
        handlePartChange={handlePartChange}
        onPrevious={onPrevious}
        onNext={onNext}
        mock={mock}
      />
    );
  }

  return (
    <DefaultQuestionLayout
      sectionType={sectionType}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      currentAnswer={currentAnswer}
      answerWidth={answerWidth}
      splitRef={splitRef}
      renderQuestionText={renderQuestionText}
      renderGapOptions={renderGapOptions}
      getChoiceOptions={getChoiceOptions}
      formatOptionLabel={formatOptionLabel}
      handleAnswerChange={handleAnswerChange}
      handleDragStart={handleDragStart}
      onBackToSections={onBackToSections}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  );
}
