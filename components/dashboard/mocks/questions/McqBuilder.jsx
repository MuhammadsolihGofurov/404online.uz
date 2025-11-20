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

function SortableOption({ option, onChange, onRemove, isMultiple, onSelect, selected }) {
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
              name="mcq-correct-answer"
              checked={selected}
              onChange={() => onSelect(option.value)}
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

  const selectedValues = useMemo(() => {
    if (isMultiple) {
      return new Set(correctAnswer?.values || []);
    }
    return new Set(correctAnswer?.value ? [correctAnswer.value] : []);
  }, [correctAnswer, isMultiple]);

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

  const handleSelect = (value) => {
    if (isMultiple) {
      const nextValues = new Set(selectedValues);
      if (nextValues.has(value)) {
        nextValues.delete(value);
      } else {
        nextValues.add(value);
      }
      onAnswerChange({ values: [...nextValues] });
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
                  selected={selectedValues.has(opt.value)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

