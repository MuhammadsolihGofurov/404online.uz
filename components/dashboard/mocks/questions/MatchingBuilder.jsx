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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

function SortableListItem({ item, onChange, onRemove, ...sortable }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

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
        className="mt-2 text-slate-400 hover:text-slate-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <input
        type="text"
        value={item.text}
        onChange={(e) => onChange(item.id, e.target.value)}
        placeholder="List item text"
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
      />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="mt-2 text-red-500 hover:text-red-600 disabled:opacity-50"
        disabled={!onRemove}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function MatchingBuilder({
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { distance: 6 }));

  const listA = useMemo(() => content?.list_a || [], [content]);
  const listB = useMemo(() => content?.list_b || [], [content]);
  const pairs = useMemo(() => correctAnswer?.pairs || [], [correctAnswer]);

  const updateList = (key, list) => {
    onContentChange({
      ...content,
      [key]: list,
    });
  };

  const updatePairs = (fromId, toId) => {
    const without = pairs.filter((pair) => pair.from !== fromId);
    onAnswerChange({
      pairs: toId ? [...without, { from: fromId, to: toId }] : without,
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = listA.findIndex((item) => item.id === active.id);
    const newIndex = listA.findIndex((item) => item.id === over.id);
    updateList("list_a", arrayMove(listA, oldIndex, newIndex));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-blue-900">
            IELTS Matching Headings Support
          </p>
        </div>
        <p className="text-xs text-blue-700">
          List B (Options/Headings) can have more items than List A (Questions/Paragraphs). 
          Extra options act as distractors and will remain unused.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">List A (Questions/Paragraphs)</p>
              <p className="text-xs text-slate-500 mt-1">{listA.length} item{listA.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateList("list_a", [
                  ...listA,
                  { id: crypto.randomUUID(), text: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={listA.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {listA.map((item) => (
                  <SortableListItem
                    key={item.id}
                    item={item}
                    onChange={(id, text) =>
                      updateList(
                        "list_a",
                        listA.map((el) =>
                          el.id === id ? { ...el, text } : el
                        )
                      )
                    }
                    onRemove={(id) =>
                      updateList(
                        "list_a",
                        listA.filter((el) => el.id !== id)
                      )
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">List B (Options/Headings)</p>
              <p className="text-xs text-slate-500 mt-1">{listB.length} option{listB.length !== 1 ? 's' : ''} {listB.length > listA.length && `(${listB.length - listA.length} unused distractor${listB.length - listA.length !== 1 ? 's' : ''})`}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateList("list_b", [
                  ...listB,
                  { id: crypto.randomUUID(), text: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            >
              <Plus size={14} />
              Add Option
            </button>
          </div>
          <div className="space-y-3">
            {listB.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) =>
                    updateList(
                      "list_b",
                      listB.map((el) =>
                        el.id === item.id ? { ...el, text: e.target.value } : el
                      )
                    )
                  }
                  placeholder="Option text"
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateList(
                      "list_b",
                      listB.filter((el) => el.id !== item.id)
                    )
                  }
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Pair answers</p>
        <div className="space-y-3">
          {listA.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center"
            >
              <p className="text-sm font-medium text-slate-600 flex-1">
                {item.text || "Untitled item"}
              </p>
              <select
                value={pairs.find((pair) => pair.from === item.id)?.to || ""}
                onChange={(e) => updatePairs(item.id, e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
              >
                <option value="">No match</option>
                {listB.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.text || "Untitled option"}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

