import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { useState, useEffect } from "react";

const ReadOnlyChoiceGroupComponent = ({ node, extension }) => {
  const { questionNumber, title, type } = node.attrs;
  const answersRef = extension.options.answers;
  const onAnswerChangeRef = extension.options.onAnswerChange;
  const hideInputsRef = extension.options.hideInputs;
  const hideInputs = hideInputsRef?.current || false;

  // Local state to trigger re-renders
  const [localAnswer, setLocalAnswer] = useState(
    answersRef.current?.[questionNumber] || (type === "multiple" ? [] : "")
  );

  // Sync from ref when it changes (but avoid circular updates)
  useEffect(() => {
    const refAnswer = answersRef.current?.[questionNumber];
    if (refAnswer !== undefined) {
      setLocalAnswer(refAnswer);
    }
  }, [answersRef.current?.[questionNumber], questionNumber]);

  // Check if we have child nodes (proper structure) or text content (JSON array)
  let options = [];

  // First, try to parse text content as JSON array (common format from backend)
  if (node.textContent) {
    try {
      const parsed = JSON.parse(node.textContent);
      if (Array.isArray(parsed)) {
        options = parsed;
      }
    } catch (e) {
      // JSON parsing failed, try extracting from child nodes
    }
  }

  // If no options from JSON, try to extract from child nodes
  if (options.length === 0 && node.content.size > 0) {
    node.content.forEach((child) => {
      if (child.type.name === "choiceItem") {
        const text = child.textContent;
        options.push(text);
      }
    });
  }

  const handleChange = (optionValue, isChecked) => {
    let newValue;
    if (type === "multiple") {
      const current = Array.isArray(localAnswer) ? localAnswer : [];
      newValue = isChecked
        ? [...current, optionValue]
        : current.filter((v) => v !== optionValue);
    } else {
      newValue = optionValue;
    }

    // Update local state immediately for instant feedback
    setLocalAnswer(newValue);
    // Also notify parent
    onAnswerChangeRef.current(questionNumber, newValue);
  };

  const getLetter = (index) => String.fromCharCode(65 + index); // A, B, C, D...

  const isChecked = (letter) => {
    if (type === "multiple") {
      return Array.isArray(localAnswer) && localAnswer.includes(letter);
    }
    return localAnswer === letter;
  };

  return (
    <NodeViewWrapper
      className="choice-group-container my-6 rounded-lg focus-within:outline focus-within:outline-2 focus-within:outline-blue-500 focus-within:outline-offset-2"
      data-question-number={questionNumber}
      tabIndex={-1}
    >
      {title && (
        <h3 className="text-base font-semibold mb-3 text-gray-900">{title}</h3>
      )}
      <div className="space-y-2">
        {options.length > 0 ? (
          options.map((option, index) => {
            const letter = getLetter(index);
            const displayText =
              typeof option === "string"
                ? option
                : option.text || option.label || JSON.stringify(option);

            return (
              <label
                key={`${questionNumber}-${letter}`}
                className={`flex items-center gap-2.5 cursor-pointer p-2 rounded transition-colors ${
                  hideInputs
                    ? isChecked(letter)
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "border-2 border-transparent hover:bg-gray-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={(e) => {
                  if (hideInputs) {
                    e.preventDefault();
                    // For single choice, always set to the clicked letter
                    // For multiple choice, toggle the selection
                    if (type === "multiple") {
                      handleChange(letter, !isChecked(letter));
                    } else {
                      handleChange(letter, true);
                    }
                  }
                }}
              >
                {!hideInputs && (
                  <input
                    type={type === "multiple" ? "checkbox" : "radio"}
                    name={`question-${questionNumber}`}
                    value={letter}
                    checked={isChecked(letter)}
                    onChange={(e) => handleChange(letter, e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                )}
                <span
                  className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs ${
                    isChecked(letter)
                      ? "text-white bg-blue-600"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 text-gray-700">{displayText}</span>
              </label>
            );
          })
        ) : (
          <NodeViewContent className="space-y-2" />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ReadOnlyChoiceGroup = Node.create({
  name: "choiceGroup",
  group: "block",
  content: "choiceItem+",

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
      hideInputs: false,
    };
  },

  addAttributes() {
    return {
      questionNumber: {
        default: "1",
        parseHTML: (element) =>
          element.getAttribute("number") ||
          element.getAttribute("data-number") ||
          "1",
        renderHTML: (attributes) => ({
          "data-number": attributes.questionNumber,
        }),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("title") || "",
      },
      type: {
        default: "single",
        parseHTML: (element) => element.getAttribute("type") || "single",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="choice-group"]' }, { tag: "choice-group" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "choice-group" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyChoiceGroupComponent);
  },
});
