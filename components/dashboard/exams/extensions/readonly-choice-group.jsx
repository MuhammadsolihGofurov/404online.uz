import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

const ReadOnlyChoiceGroupComponent = ({ node, extension }) => {
  const { questionNumber, title, type } = node.attrs;
  const { answers, onAnswerChange } = extension.options;

  const currentAnswer =
    answers[questionNumber] || (type === "multiple" ? [] : "");

  const handleChange = (optionValue, isChecked) => {
    if (type === "multiple") {
      const current = Array.isArray(currentAnswer) ? currentAnswer : [];
      const updated = isChecked
        ? [...current, optionValue]
        : current.filter((v) => v !== optionValue);
      onAnswerChange(questionNumber, updated);
    } else {
      onAnswerChange(questionNumber, optionValue);
    }
  };

  return (
    <NodeViewWrapper className="choice-group-container my-6">
      {title && (
        <h3 className="text-base font-semibold mb-3 text-gray-900">{title}</h3>
      )}
      <div className="space-y-2">
        <NodeViewContent className="space-y-2" />
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
    };
  },

  addAttributes() {
    return {
      questionNumber: { default: "1" },
      title: { default: "" },
      type: { default: "single" },
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
