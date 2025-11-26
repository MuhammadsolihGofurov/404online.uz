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

const getItemIdentifier = (item, index, prefix) => {
  if (!item) return `${prefix}-${index}`;
  return (
    item.id ||
    item.key ||
    item.value ||
    item.label ||
    `${prefix}-${index}`
  );
};

const getItemText = (item) => {
  if (typeof item === "object" && item !== null) {
    return item.text ?? "";
  }
  return typeof item === "string" ? item : "";
};

function SortableListItem({ item, sortableId, itemIndex, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 border bg-slate-50 border-slate-200 rounded-xl"
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
        value={getItemText(item)}
        onChange={(e) => onChange(itemIndex, e.target.value)}
        placeholder="List item text"
        className="flex-1 px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
      />
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(itemIndex);
        }}
        className="mt-2 text-red-500 hover:text-red-600"
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
  
  // 🛡️ CRITICAL: Safety limits to prevent browser crash
  const MAX_SAFE_LIST_ITEMS = 50; // Reasonable limit for matching items
  const safeListA = listA.length > MAX_SAFE_LIST_ITEMS ? listA.slice(0, MAX_SAFE_LIST_ITEMS) : listA;
  const safeListB = listB.length > MAX_SAFE_LIST_ITEMS ? listB.slice(0, MAX_SAFE_LIST_ITEMS) : listB;
  const hasExceededListALimit = listA.length > MAX_SAFE_LIST_ITEMS;
  const hasExceededListBLimit = listB.length > MAX_SAFE_LIST_ITEMS;
  
  const pairs = useMemo(() => correctAnswer?.pairs || [], [correctAnswer]);
  const listAHeading = content?.list_a_heading ?? "";
  const listBHeading = content?.list_b_heading ?? "";

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

  const updateHeading = (key, value) => {
    onContentChange({
      ...content,
      [key]: value,
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(active.id);
    const newIndex = sortableIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    updateList("list_a", arrayMove(listA, oldIndex, newIndex));
  };

  const sortableIds = useMemo(
    () => safeListA.map((item, index) => getItemIdentifier(item, index, "listA")),
    [safeListA]
  );

  return (
    <div className="space-y-6">
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
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
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Left column header
            </label>
            <input
              type="text"
              value={listAHeading}
              onChange={(e) => updateHeading("list_a_heading", e.target.value)}
              placeholder="List A Heading (optional)"
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">List A (Questions/Paragraphs)</p>
              <p className="mt-1 text-xs text-slate-500">{listA.length} item{listA.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateList("list_a", [
                  ...listA,
                  { id: crypto.randomUUID(), text: "" },
                ])
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>

          {hasExceededListALimit && (
            <div className="p-4 mb-4 border-2 border-red-500 rounded-lg bg-red-50">
              <p className="font-semibold text-red-700">⚠️ List A Limit Exceeded</p>
              <p className="text-sm text-red-600">
                You have {listA.length} items, but only the first {MAX_SAFE_LIST_ITEMS} are shown to prevent browser crash.
              </p>
            </div>
          )}

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {safeListA.map((item, index) => (
                  <SortableListItem
                    key={sortableIds[index]}
                    item={item}
                    sortableId={sortableIds[index]}
                    itemIndex={index}
                    onChange={(itemIndex, text) =>
                      updateList(
                        "list_a",
                        listA.map((el, idx) =>
                          idx === itemIndex
                            ? typeof el === "object" && el !== null
                              ? { ...el, text }
                              : { text }
                            : el
                        )
                      )
                    }
                    onRemove={(itemIndex) => {
                      const itemId = sortableIds[itemIndex];
                      const updatedList = listA.filter(
                        (_, idx) => idx !== itemIndex
                      );
                      updateList("list_a", updatedList);

                      if (itemId) {
                        const withoutPairs = pairs.filter(
                          (pair) => pair.from !== itemId
                        );
                        if (withoutPairs.length !== pairs.length) {
                          onAnswerChange({ pairs: withoutPairs });
                        }
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Right column header
            </label>
            <input
              type="text"
              value={listBHeading}
              onChange={(e) => updateHeading("list_b_heading", e.target.value)}
              placeholder="List B Heading (optional)"
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">List B (Options/Headings)</p>
              <p className="mt-1 text-xs text-slate-500">{listB.length} option{listB.length !== 1 ? 's' : ''} {listB.length > listA.length && `(${listB.length - listA.length} unused distractor${listB.length - listA.length !== 1 ? 's' : ''})`}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateList("list_b", [
                  ...listB,
                  { id: crypto.randomUUID(), text: "" },
                ])
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
            >
              <Plus size={14} />
              Add Option
            </button>
          </div>
          {hasExceededListBLimit && (
            <div className="p-4 mb-4 border-2 border-red-500 rounded-lg bg-red-50">
              <p className="font-semibold text-red-700">⚠️ List B Limit Exceeded</p>
              <p className="text-sm text-red-600">
                You have {listB.length} items, but only the first {MAX_SAFE_LIST_ITEMS} are shown to prevent browser crash.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {safeListB.map((item, index) => (
              <div
                key={getItemIdentifier(item, index, "listB")}
                className="flex items-center gap-3 px-3 py-2 bg-white border rounded-xl border-slate-200"
              >
                <input
                  type="text"
                  value={getItemText(item)}
                  onChange={(e) =>
                    updateList(
                      "list_b",
                      listB.map((el, idx) =>
                        idx === index
                          ? typeof el === "object" && el !== null
                            ? { ...el, text: e.target.value }
                            : { text: e.target.value }
                          : el
                      )
                    )
                  }
                  placeholder="Option text"
                  className="flex-1 px-3 py-2 text-sm border rounded-md border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateList(
                      "list_b",
                      listB.filter((_, idx) => idx !== index)
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

      <div className="space-y-4 md:col-span-2">
        <p className="text-sm font-semibold text-slate-700">Pair answers</p>
        <div className="space-y-3">
          {safeListA.map((item, index) => {
            const itemId = sortableIds[index];
            return (
              <div
                key={itemId}
                className="flex flex-col gap-2 p-4 bg-white border rounded-2xl border-slate-200 md:flex-row md:items-center"
              >
                <p className="flex-1 text-sm font-medium text-slate-600">
                  {getItemText(item) || "Untitled item"}
                </p>
                <select
                  value={pairs.find((pair) => pair.from === itemId)?.to || ""}
                  onChange={(e) => updatePairs(itemId, e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
                >
                  <option value="">No match</option>
                  {safeListB.map((match, idx) => {
                    const matchId = getItemIdentifier(match, idx, "listB");
                    return (
                      <option key={matchId} value={matchId}>
                        {getItemText(match) || "Untitled option"}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

