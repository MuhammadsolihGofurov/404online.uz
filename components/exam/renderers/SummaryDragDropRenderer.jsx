import React, { useState, useMemo, useCallback, memo } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { RichText } from "@/components/ui/RichText";
import { BLANK_REGEX } from "@/components/dashboard/mocks/fourth-step/utils/questionUtils";
import { X } from "lucide-react";

/**
 * Draggable Word Chip Component
 * Renders a word from the word bank that can be dragged to blanks
 */
const DraggableWord = memo(({ id, text, isUsed }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `word-${id}`,
        data: { text, wordId: id },
        disabled: isUsed
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
        inline-block px-4 py-2 m-1 rounded-lg border-2 font-medium text-sm
        transition-all duration-200 ease-in-out select-none
        ${isUsed
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-blue-100 border-blue-300 text-blue-900 cursor-grab hover:scale-105 hover:shadow-md active:cursor-grabbing active:scale-95'
                }
        ${isDragging ? 'opacity-30' : ''}
      `}
        >
            {text}
        </div>
    );
});

DraggableWord.displayName = "DraggableWord";

/**
 * Filled Blank Chip Component
 * Shows a word that has been placed in a blank
 */
const FilledChip = memo(({ text, onRemove, disabled }) => {
    return (
        <span className="inline-flex items-center gap-1 px-3 py-1 mx-1 bg-blue-50 border-2 border-blue-500 rounded-lg text-blue-900 font-bold text-base">
            {text}
            {!disabled && (
                <button
                    onClick={onRemove}
                    className="ml-1 text-blue-600 hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                    aria-label="Remove"
                >
                    <X size={14} />
                </button>
            )}
        </span>
    );
});

FilledChip.displayName = "FilledChip";

/**
 * Droppable Blank Zone Component
 * Inline drop zone within the summary text
 */
const DroppableBlank = memo(({ blankId, value, onRemove, disabled }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `blank-${blankId}`,
        disabled
    });

    return (
        <span
            ref={setNodeRef}
            className={`
        inline-block min-w-[120px] align-middle
        transition-all duration-200
        ${isOver ? 'scale-105' : ''}
      `}
        >
            {value ? (
                <FilledChip text={value} onRemove={onRemove} disabled={disabled} />
            ) : (
                <span className={`
          inline-block px-3 py-1 mx-1 min-w-[100px] text-center
          border-2 border-dashed rounded-lg text-sm
          transition-all duration-200
          ${isOver
                        ? 'border-blue-400 bg-blue-50 scale-105'
                        : 'border-gray-300 bg-gray-50 text-gray-400'
                    }
        `}>
                    {blankId}
                </span>
            )}
        </span>
    );
});

DroppableBlank.displayName = "DroppableBlank";

/**
 * Main Summary Drag & Drop Renderer Component
 * Implements IELTS-style drag-and-drop for summary completion questions
 */
export const SummaryDragDropRenderer = memo(({ question, value, onChange, disabled }) => {
    const { prompt, content, question_number } = question;
    const text = content?.text || "";
    const wordBank = content?.word_bank || [];

    // Current assignments: { blankId: wordText }
    const [assignments, setAssignments] = useState(value?.values || {});
    const [activeId, setActiveId] = useState(null);

    // Configure sensors for better drag experience
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        })
    );

    // Track which words are currently used
    const usedWords = useMemo(() => {
        return new Set(Object.values(assignments));
    }, [assignments]);

    // Handle blank removal
    const handleRemove = useCallback((blankId) => {
        setAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[blankId];
            onChange({ values: newAssignments });
            return newAssignments;
        });
    }, [onChange]);

    // Handle drag start
    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return; // Dropped outside

        // Extract IDs
        const activeIdStr = active.id.toString();
        const overIdStr = over.id.toString();

        // Check if dropped on a blank
        if (overIdStr.startsWith('blank-')) {
            const blankId = overIdStr.replace('blank-', '');
            const wordText = active.data.current.text;

            // Check if dragging from another blank (move operation)
            if (activeIdStr.startsWith('blank-')) {
                const sourceBlankId = activeIdStr.replace('blank-', '');

                setAssignments(prev => {
                    const newAssignments = { ...prev };

                    // Remove from source
                    delete newAssignments[sourceBlankId];

                    // Add to target
                    newAssignments[blankId] = wordText;

                    onChange({ values: newAssignments });
                    return newAssignments;
                });
            } else {
                // Dragging from word bank
                setAssignments(prev => {
                    const newAssignments = {
                        ...prev,
                        [blankId]: wordText
                    };
                    onChange({ values: newAssignments });
                    return newAssignments;
                });
            }
        }
    }, [onChange]);

    // Render the summary text with inline drop zones
    const renderContent = useMemo(() => {
        if (!text) return null;

        const parts = [];
        let lastIndex = 0;
        const regex = new RegExp(BLANK_REGEX.source, 'g');
        let match;
        let idx = 0;

        while ((match = regex.exec(text)) !== null) {
            // Add text before the blank
            if (match.index > lastIndex) {
                parts.push(
                    <span
                        key={`text-${idx++}`}
                        dangerouslySetInnerHTML={{ __html: text.substring(lastIndex, match.index) }}
                    />
                );
            }

            // Add droppable blank
            const blankId = match[1]?.trim();
            const value = assignments[blankId] || null;

            parts.push(
                <DroppableBlank
                    key={`blank-${blankId}`}
                    blankId={blankId}
                    value={value}
                    onRemove={() => handleRemove(blankId)}
                    disabled={disabled}
                />
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(
                <span
                    key={`text-${idx++}`}
                    dangerouslySetInnerHTML={{ __html: text.substring(lastIndex) }}
                />
            );
        }

        return parts;
    }, [text, assignments, disabled, handleRemove]);

    // Get the currently dragging word text for overlay
    const activeWord = useMemo(() => {
        if (!activeId) return null;

        const activeIdStr = activeId.toString();

        // If dragging from word bank
        if (activeIdStr.startsWith('word-')) {
            const wordId = activeIdStr.replace('word-', '');
            const word = wordBank.find(w => w.id === wordId);
            return word?.text;
        }

        // If dragging from a blank
        if (activeIdStr.startsWith('blank-')) {
            const blankId = activeIdStr.replace('blank-', '');
            return assignments[blankId];
        }

        return null;
    }, [activeId, wordBank, assignments]);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6">
                {/* Question Number and Prompt */}
                <div className="flex items-start gap-4">
                    <span className="font-bold text-gray-700 text-lg min-w-[3rem]">
                        Q{question_number}
                    </span>
                    <div className="prose max-w-none text-gray-800">
                        <RichText content={prompt} />
                    </div>
                </div>

                {/* Summary Text with Drop Zones */}
                <div className="ml-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm leading-loose text-gray-800 text-lg font-serif whitespace-pre-wrap">
                    {renderContent}
                </div>

                {/* Word Bank */}
                {!disabled && wordBank.length > 0 && (
                    <div className="ml-16 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-bold text-gray-700 text-base">Word Bank:</span>
                            <span className="text-sm text-gray-500">
                                ({wordBank.filter(w => !usedWords.has(w.text)).length} available)
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {wordBank.map((word) => (
                                <DraggableWord
                                    key={word.id}
                                    id={word.id}
                                    text={word.text}
                                    isUsed={usedWords.has(word.text)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Drag Overlay - Shows preview while dragging */}
                <DragOverlay>
                    {activeWord && (
                        <div className="px-4 py-2 bg-blue-200 border-2 border-blue-400 rounded-lg text-blue-900 font-bold shadow-2xl cursor-grabbing rotate-3 scale-110">
                            {activeWord}
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
});

SummaryDragDropRenderer.displayName = "SummaryDragDropRenderer";
