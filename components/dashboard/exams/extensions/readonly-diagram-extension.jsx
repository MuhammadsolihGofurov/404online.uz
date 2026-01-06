"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

// Individual input component with state
const DiagramInput = ({
  questionNumber,
  answers,
  onAnswerChange,
  ...props
}) => {
  const [value, setValue] = React.useState(answers[questionNumber] || "");

  React.useEffect(() => {
    // Only update if the answer from parent is different from our current value
    const newValue = answers[questionNumber] || "";
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [answers[questionNumber]]); // Only depend on the specific question's answer

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onAnswerChange) {
      onAnswerChange(questionNumber, e.target.value);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      data-question-number={questionNumber}
      {...props}
    />
  );
};

const ReadOnlyDiagramComponent = ({ node, extension }) => {
  const { src, labels = [], dragOptions = [] } = node.attrs;
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [usedOptions, setUsedOptions] = React.useState({});
  const [forceUpdate, setForceUpdate] = React.useState(0);

  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;
  const answers = answersRef.current || {};

  // For map labeling, generate options A-E if no dragOptions provided but we have labels
  const defaultOptions =
    labels.length > 0 && dragOptions.length === 0
      ? Array.from({ length: 5 }, (_, i) => String.fromCharCode(65 + i)) // A, B, C, D, E
      : [];

  const effectiveDragOptions =
    dragOptions.length > 0 ? dragOptions : defaultOptions;
  const isDragMode = effectiveDragOptions && effectiveDragOptions.length > 0;

  // Debug: Log what we're receiving
  React.useEffect(() => {
    console.log("Diagram attrs:", {
      src,
      labels,
      dragOptions,
      defaultOptions,
      effectiveDragOptions,
      isDragMode,
    });
  }, [src, labels, dragOptions, isDragMode]);

  // Track which options are used
  React.useEffect(() => {
    if (isDragMode) {
      const used = {};
      labels.forEach((label) => {
        const answer = answers[label.number];
        if (answer) {
          used[answer] = label.number;
        }
      });
      setUsedOptions(used);
    }
  }, [answers, labels, isDragMode, forceUpdate]);

  const handleDragStart = (e, option) => {
    setDraggedItem(option);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", option);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, questionNumber) => {
    e.preventDefault();
    const option = e.dataTransfer.getData("text/plain");

    if (option && onAnswerChangeRef?.current) {
      // Remove this option from any other question that might have it
      Object.keys(usedOptions).forEach((usedOption) => {
        if (
          usedOption === option &&
          usedOptions[usedOption] !== questionNumber
        ) {
          onAnswerChangeRef.current(usedOptions[usedOption], "");
        }
      });

      // Set the new answer
      onAnswerChangeRef.current(questionNumber, option);

      // Force re-render to show the change immediately
      setForceUpdate((prev) => prev + 1);
    }
    setDraggedItem(null);
  };

  const handleRemoveAnswer = (questionNumber) => {
    if (onAnswerChangeRef?.current) {
      onAnswerChangeRef.current(questionNumber, "");
      // Force re-render
      setForceUpdate((prev) => prev + 1);
    }
  };

  return (
    <NodeViewWrapper className="my-8 p-5 bg-white border-2 border-slate-200 rounded-2xl">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          Diagram / Map Labeling
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          {isDragMode
            ? "Drag and drop the options to label the diagram"
            : "Label the diagram by entering your answers in the boxes"}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 min-h-[200px]">
        {src ? (
          <div className="relative inline-block w-full">
            <img
              src={src}
              alt="Diagram"
              className="w-full h-auto block select-none"
              draggable={false}
            />

            {/* Only show positioned labels on the image if they have valid x,y coordinates */}
            {labels
              .filter((label) => label.x && label.y)
              .map((label, index) => {
                const answer = answers[label.number];

                return (
                  <div
                    key={index}
                    style={{ left: `${label.x}%`, top: `${label.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    onDragOver={isDragMode ? handleDragOver : undefined}
                    onDrop={
                      isDragMode
                        ? (e) => handleDrop(e, label.number)
                        : undefined
                    }
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white">
                        {label.number}
                      </div>

                      {isDragMode ? (
                        <div
                          className={`min-w-[80px] h-7 flex items-center justify-center text-xs border rounded shadow-md ${
                            answer
                              ? "bg-white border-blue-500 text-gray-800 font-medium"
                              : "bg-blue-50 border-dashed border-blue-300 text-blue-400"
                          }`}
                        >
                          {answer ? (
                            <div className="flex items-center gap-1 px-2">
                              <span>{answer}</span>
                              <button
                                onClick={() => handleRemoveAnswer(label.number)}
                                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                                type="button"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            "Drop here"
                          )}
                        </div>
                      ) : (
                        <DiagramInput
                          questionNumber={label.number}
                          answers={answers}
                          onAnswerChange={onAnswerChangeRef?.current}
                          className="w-20 h-7 text-center text-xs border border-slate-300 rounded bg-white shadow-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                          placeholder="..."
                        />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-400 italic">No diagram image</p>
          </div>
        )}
      </div>

      {isDragMode && (
        <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Available Options:
          </p>
          <div className="flex flex-wrap gap-2">
            {effectiveDragOptions.map((option, index) => {
              const isUsed = usedOptions[option];
              const isDragging = draggedItem === option;

              return (
                <div
                  key={index}
                  draggable={!isUsed}
                  onDragStart={(e) => handleDragStart(e, option)}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isUsed
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : isDragging
                      ? "bg-blue-600 text-white cursor-grabbing opacity-50"
                      : "bg-white text-blue-700 border border-blue-300 cursor-grab hover:bg-blue-100"
                  }`}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid layout for questions without positioned labels OR for all questions in drag mode */}
      {labels?.length > 0 &&
        (labels.filter((l) => !l.x || !l.y).length > 0 || isDragMode) && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {labels?.map((l, i) => {
              const answer = answers[l?.number];

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  onDragOver={isDragMode ? handleDragOver : undefined}
                  onDrop={
                    isDragMode ? (e) => handleDrop(e, l?.number) : undefined
                  }
                >
                  <span className="font-bold text-slate-700 text-base min-w-[2rem]">
                    {l?.number}.
                  </span>

                  {isDragMode ? (
                    <div
                      className={`flex-1 h-10 flex items-center justify-center text-sm border-2 rounded-md transition-all ${
                        answer
                          ? "bg-white border-blue-500 text-gray-800 font-medium"
                          : "bg-white border-dashed border-slate-300 text-slate-400"
                      }`}
                    >
                      {answer ? (
                        <div className="flex items-center gap-2 px-3">
                          <span className="font-semibold text-lg">
                            {answer}
                          </span>
                          <button
                            onClick={() => handleRemoveAnswer(l?.number)}
                            className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        "Drop answer here"
                      )}
                    </div>
                  ) : (
                    <DiagramInput
                      questionNumber={l?.number}
                      answers={answers}
                      onAnswerChange={onAnswerChangeRef?.current}
                      className="flex-1 h-10 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Your answer"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
    </NodeViewWrapper>
  );
};

export const ReadOnlyDiagramBlock = Node.create({
  name: "diagramBlock",
  group: "block",
  draggable: false,
  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },
  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("src") || element.getAttribute("data-src") || "",
      },
      labels: {
        default: [],
        parseHTML: (element) => {
          const labelsAttr =
            element.getAttribute("labels") ||
            element.getAttribute("data-labels");
          if (labelsAttr) {
            try {
              return JSON.parse(labelsAttr);
            } catch (e) {
              console.error("Failed to parse labels:", e);
              return [];
            }
          }
          return [];
        },
      },
      dragOptions: {
        default: [],
        parseHTML: (element) => {
          const optionsAttr =
            element.getAttribute("dragOptions") ||
            element.getAttribute("drag-options") ||
            element.getAttribute("data-drag-options") ||
            element.getAttribute("options");
          if (optionsAttr) {
            try {
              return JSON.parse(optionsAttr);
            } catch (e) {
              console.error("Failed to parse dragOptions:", e);
              return [];
            }
          }
          return [];
        },
      },
    };
  },
  parseHTML: () => [
    { tag: 'div[data-type="diagram-block"]' },
    { tag: "diagram-block" },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "diagram-block" }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ReadOnlyDiagramComponent),
});
