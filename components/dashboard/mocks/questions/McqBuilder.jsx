import React, { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function SortableOption({ option, onChange, onRemove, isMultiple, onSelect, selected, questionNumber = null }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3"
    >
      <button
        type="button"
        className="mt-2 text-slate-400 hover:text-slate-600 transition"
        {...attributes}
        {...listeners}
        aria-label="Drag option"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border text-xs font-semibold text-slate-600">
            {option.value}
          </span>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type={isMultiple ? "checkbox" : "radio"}
              name={questionNumber !== null ? `mcq-correct-${questionNumber}` : "mcq-correct-answer"}
              checked={selected}
              onChange={() => onSelect(option.value, questionNumber)}
              className="text-main focus:ring-main"
            />
            Correct
          </label>
        </div>
        <textarea
          value={option.text}
          onChange={(e) => onChange(option.id, e.target.value)}
          placeholder="Option text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/20 transition"
          rows={3}
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(option.id)}
        className="mt-2 text-red-500 hover:text-red-600 disabled:opacity-40"
        disabled={!onRemove}
        aria-label="Remove option"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function McqBuilder({
  questionType,
  content,
  correctAnswer,
  questionNumberStart = 1,
  questionNumberEnd = 1,
  onContentChange,
  onAnswerChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const options = useMemo(() => content?.options || [], [content]);
  const isMultiple = questionType === "MCQ_MULTIPLE";
  const isGrouped = questionNumberEnd > questionNumberStart;

  const selectedValues = useMemo(() => {
    if (isMultiple) {
      return new Set(correctAnswer?.values || []);
    }
    if (isGrouped) {
      // For grouped MCQ_SINGLE, return a map of question number -> selected value
      const values = correctAnswer?.values || {};
      return values;
    }
    return new Set(correctAnswer?.value ? [correctAnswer.value] : []);
  }, [correctAnswer, isMultiple, isGrouped]);

  const updateOptions = (nextOptions) => {
    onContentChange({
      ...content,
      options: nextOptions.map((opt, index) => ({
        ...opt,
        value: alphabet[index] || opt.value,
      })),
    });
  };

  const handleOptionChange = (id, text) => {
    updateOptions(
      options.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleAddOption = () => {
    const newOption = {
      id: crypto.randomUUID(),
      value: alphabet[options.length] || `Option ${options.length + 1}`,
      text: "",
    };
    updateOptions([...options, newOption]);
  };

  const handleRemoveOption = (id) => {
    if (options.length <= 2) return;
    const filtered = options.filter((opt) => opt.id !== id);
    updateOptions(filtered);

    if (!isMultiple && correctAnswer?.value === id) {
      onAnswerChange({ value: "" });
    }
    if (isMultiple && selectedValues.has(id)) {
      const nextValues = [...selectedValues].filter((val) => val !== id);
      onAnswerChange({ values: nextValues });
    }
  };

  const handleSelect = (value, questionNumber = null) => {
    if (isMultiple) {
      const nextValues = new Set(selectedValues);
      if (nextValues.has(value)) {
        nextValues.delete(value);
      } else {
        nextValues.add(value);
      }
      onAnswerChange({ values: [...nextValues] });
    } else if (isGrouped && questionNumber !== null) {
      // For grouped MCQ_SINGLE, update the specific question number
      const currentValues = typeof selectedValues === 'object' && !(selectedValues instanceof Set)
        ? { ...selectedValues }
        : {};
      currentValues[String(questionNumber)] = value;
      onAnswerChange({ values: currentValues });
    } else {
      onAnswerChange({ value });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = options.findIndex((item) => item.id === active.id);
    const newIndex = options.findIndex((item) => item.id === over.id);
    updateOptions(arrayMove(options, oldIndex, newIndex));
  };

  // For grouped MCQ_SINGLE, render separate answer sections for each question
  if (isGrouped && !isMultiple) {
    const questionRange = [];
    for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
      questionRange.push(i);
    }
    const statements = content?.statements || [];
    
    // Check if using independent options mode
    const useSameOptions = content?.use_same_options !== false; // Default to true
    const questions = content?.questions || [];

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Instructions (optional)
        </label>
        <textarea
          value={content?.instructions || ""}
          onChange={(e) =>
            onContentChange({ ...content, instructions: e.target.value })
          }
          placeholder="e.g., Choose ONE answer."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10 transition"
          rows={2}
        />

        {/* Toggle for independent options */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSameOptions}
              onChange={(e) => {
                const newUseSameOptions = e.target.checked;
                if (newUseSameOptions) {
                  // Switching to same options mode - keep options, remove questions
                  onContentChange({ ...content, use_same_options: true });
                } else {
                  // Switching to independent mode - initialize questions if empty
                  let newQuestions = questions;
                  if (questions.length === 0) {
                    newQuestions = questionRange.map((qNum) => ({
                      id: String(qNum),
                      text: statements[qNum - questionNumberStart] || "",
                      options: options.map((opt) => ({ 
                        id: opt.id || crypto.randomUUID(),
                        value: opt.value,
                        text: opt.text 
                      })), // Copy current options
                    }));
                  }
                  onContentChange({ 
                    ...content, 
                    use_same_options: false,
                    questions: newQuestions 
                  });
                }
              }}
              className="w-4 h-4 text-main focus:ring-main rounded"
            />
            <span className="text-sm font-medium text-slate-700">
              Use same options for all questions
            </span>
          </label>
        </div>

        {/* Independent Options Mode */}
        {!useSameOptions ? (
          <div className="space-y-6">
            {questionRange.map((qNum) => {
              const questionIndex = questions.findIndex(q => q.id === String(qNum));
              const question = questionIndex >= 0 
                ? questions[questionIndex] 
                : {
                    id: String(qNum),
                    text: statements[qNum - questionNumberStart] || "",
                    options: options.map((opt) => ({ ...opt })),
                  };
              const questionOptions = question.options || [];

              const updateQuestionOptions = (newOptions) => {
                const updatedQuestions = [...questions];
                  if (questionIndex >= 0) {
                    updatedQuestions[questionIndex] = {
                      ...question,
                      options: newOptions.map((opt, idx) => ({
                        ...opt,
                        value: alphabet[idx] || opt.value,
                      })),
                    };
                  } else {
                    updatedQuestions.push({
                      ...question,
                      options: newOptions.map((opt, idx) => ({
                        ...opt,
                        value: alphabet[idx] || opt.value,
                      })),
                    });
                  }
                  onContentChange({ ...content, questions: updatedQuestions });
                };

                const handleQuestionOptionChange = (optionId, text) => {
                  updateQuestionOptions(
                    questionOptions.map((opt) => (opt.id === optionId ? { ...opt, text } : opt))
                  );
                };

                const handleQuestionAddOption = () => {
                  const newOption = {
                    id: crypto.randomUUID(),
                    value: alphabet[questionOptions.length] || `Option ${questionOptions.length + 1}`,
                    text: "",
                  };
                  updateQuestionOptions([...questionOptions, newOption]);
                };

                const handleQuestionRemoveOption = (optionId) => {
                  if (questionOptions.length <= 2) return;
                  const filtered = questionOptions.filter((opt) => opt.id !== optionId);
                  updateQuestionOptions(filtered);
                };

                const handleQuestionDragEnd = (event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;

                  const oldIndex = questionOptions.findIndex((item) => item.id === active.id);
                  const newIndex = questionOptions.findIndex((item) => item.id === over.id);
                  updateQuestionOptions(arrayMove(questionOptions, oldIndex, newIndex));
                };

                const currentValue = typeof selectedValues === 'object' && !(selectedValues instanceof Set)
                  ? selectedValues[String(qNum)] || ""
                  : "";

                return (
                  <div key={qNum} className="p-4 border border-slate-200 rounded-xl bg-white">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Q{qNum} - Question Text
                        </label>
                        <input
                          type="text"
                          value={question.text || ""}
                          onChange={(e) => {
                            const updatedQuestions = [...questions];
                            if (questionIndex >= 0) {
                              updatedQuestions[questionIndex] = { ...question, text: e.target.value };
                            } else {
                              updatedQuestions.push({ ...question, text: e.target.value });
                            }
                            onContentChange({ ...content, questions: updatedQuestions });
                          }}
                          placeholder={`Question text for Q${qNum}`}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/20"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">
                            Options for Q{qNum} ({questionOptions.length})
                          </p>
                          <button
                            type="button"
                            onClick={handleQuestionAddOption}
                            className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm font-medium shadow-lg shadow-main/30 hover:bg-main/90 transition"
                          >
                            <Plus size={16} />
                            Add option
                          </button>
                        </div>

                        <DndContext sensors={sensors} onDragEnd={handleQuestionDragEnd}>
                          <SortableContext
                            items={questionOptions.map((opt) => opt.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="flex flex-col gap-3">
                              {questionOptions.map((opt) => (
                                <SortableOption
                                  key={opt.id}
                                  option={opt}
                                  onChange={handleQuestionOptionChange}
                                  onRemove={questionOptions.length > 2 ? handleQuestionRemoveOption : null}
                                  isMultiple={false}
                                  onSelect={handleSelect}
                                  selected={currentValue === opt.value}
                                  questionNumber={qNum}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <>
            {/* Optional: Add statements input */}
            {statements.length === 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Sub-question statements (optional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newStatements = [];
                    for (let i = questionNumberStart; i <= questionNumberEnd; i++) {
                      newStatements.push("");
                    }
                    onContentChange({ ...content, statements: newStatements });
                  }}
                  className="text-sm text-main hover:underline"
                >
                  Add statements for each sub-question
                </button>
              </div>
            )}

            {statements.length > 0 && (
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Sub-question statements
                </label>
                {statements.map((stmt, idx) => {
                  const qNum = questionNumberStart + idx;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600 min-w-[40px]">
                        Q{qNum}:
                      </span>
                      <input
                        type="text"
                        value={stmt}
                        onChange={(e) => {
                          const newStatements = [...statements];
                          newStatements[idx] = e.target.value;
                          onContentChange({ ...content, statements: newStatements });
                        }}
                        placeholder={`Statement for Q${qNum}`}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/20"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-6">
              {/* Master Options List (Editable) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Options ({options.length})
                  </p>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm font-medium shadow-lg shadow-main/30 hover:bg-main/90 transition"
                  >
                    <Plus size={16} />
                    Add option
                  </button>
                </div>

                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={options.map((opt) => opt.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3">
                      {options.map((opt) => (
                        <SortableOption
                          key={opt.id}
                          option={opt}
                          onChange={handleOptionChange}
                          onRemove={options.length > 2 ? handleRemoveOption : null}
                          isMultiple={false}
                          onSelect={() => {}} // Disabled in master list
                          selected={false} // Disabled in master list
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Answer Selection (Grouped by Question) */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  Select correct answers for each question
                </p>
                {questionRange.map((qNum) => {
                  const currentValue = typeof selectedValues === 'object' && !(selectedValues instanceof Set)
                    ? selectedValues[String(qNum)] || ""
                    : "";
                  const statement = statements[qNum - questionNumberStart];
                  
                  return (
                    <div key={qNum} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700 min-w-[50px]">
                            Q{qNum}
                          </span>
                          {statement && (
                            <span className="text-sm text-slate-500">
                              - {statement}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {options.map((opt) => (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                                currentValue === opt.value
                                  ? "border-main bg-main/5"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`mcq-grouped-${qNum}`}
                                checked={currentValue === opt.value}
                                onChange={() => handleSelect(opt.value, qNum)}
                                className="w-5 h-5 text-main focus:ring-main cursor-pointer"
                              />
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border text-xs font-semibold text-slate-600">
                                {opt.value}
                              </span>
                              <span className="text-sm text-slate-700 flex-1">
                                {opt.text || `Option ${opt.value}`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </>
        )}
      </div>
    );
  }

  // Original behavior for single questions or MCQ_MULTIPLE
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Instructions (optional)
      </label>
      <textarea
        value={content?.instructions || ""}
        onChange={(e) =>
          onContentChange({ ...content, instructions: e.target.value })
        }
        placeholder="e.g., Choose ONE answer."
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-main focus:ring-4 focus:ring-main/10 transition"
        rows={2}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Options ({options.length})
          </p>
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm font-medium shadow-lg shadow-main/30 hover:bg-main/90 transition"
          >
            <Plus size={16} />
            Add option
          </button>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={options.map((opt) => opt.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {options.map((opt) => (
                <SortableOption
                  key={opt.id}
                  option={opt}
                  onChange={handleOptionChange}
                  onRemove={options.length > 2 ? handleRemoveOption : null}
                  isMultiple={isMultiple}
                  onSelect={handleSelect}
                  selected={selectedValues instanceof Set ? selectedValues.has(opt.value) : false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

