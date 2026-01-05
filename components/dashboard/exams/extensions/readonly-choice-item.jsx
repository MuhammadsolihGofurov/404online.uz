import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

const ReadOnlyChoiceItemComponent = ({ node, getPos, editor, extension }) => {
  const { isCorrect } = node.attrs;
  const { answers, onAnswerChange } = extension.options;

  const getLetter = () => {
    const pos = getPos();
    if (typeof pos !== "number") return "";

    try {
      const $pos = editor.state.doc.resolve(pos);
      const index = $pos.index($pos.depth);
      return String.fromCharCode(65 + index);
    } catch (e) {
      return "";
    }
  };

  const getParentAttrs = () => {
    const pos = getPos();
    if (typeof pos !== "number") return {};

    try {
      const $pos = editor.state.doc.resolve(pos);
      return $pos.parent.attrs;
    } catch {
      return {};
    }
  };

  const handleChange = (e) => {
    const parentAttrs = getParentAttrs();
    const questionNumber = parentAttrs.questionNumber;
    const letter = getLetter();

    if (!questionNumber) return;

    if (parentAttrs.type === "multiple") {
      const current = Array.isArray(answers[questionNumber])
        ? answers[questionNumber]
        : [];
      const updated = e.target.checked
        ? [...current, letter]
        : current.filter((v) => v !== letter);
      onAnswerChange(questionNumber, updated);
    } else {
      if (e.target.checked) {
        onAnswerChange(questionNumber, letter);
      }
    }
  };

  const isChecked = () => {
    const parentAttrs = getParentAttrs();
    const questionNumber = parentAttrs.questionNumber;
    const letter = getLetter();

    if (!questionNumber) return false;

    const answer = answers[questionNumber];
    if (parentAttrs.type === "multiple") {
      return Array.isArray(answer) && answer.includes(letter);
    }
    return answer === letter;
  };

  const inputType = () => {
    const parentAttrs = getParentAttrs();
    return parentAttrs.type === "multiple" ? "checkbox" : "radio";
  };

  const parentAttrs = getParentAttrs();
  const questionNumber = parentAttrs.questionNumber;

  return (
    <NodeViewWrapper className="choice-item-wrapper flex items-center gap-2 my-1.5">
      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
        <input
          type={inputType()}
          checked={isChecked()}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
          data-question-number={questionNumber}
        />
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs text-gray-600 bg-gray-100">
          {getLetter()}
        </span>
        <NodeViewContent className="flex-1 text-gray-700" />
      </label>
    </NodeViewWrapper>
  );
};

export const ReadOnlyChoiceItem = Node.create({
  name: "choiceItem",
  group: "block",
  content: "inline*",

  addOptions() {
    return {
      answers: {},
      onAnswerChange: () => {},
    };
  },

  addAttributes() {
    return {
      isCorrect: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="choice-item"]' }, { tag: "choice-item" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "choice-item" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyChoiceItemComponent);
  },
});
