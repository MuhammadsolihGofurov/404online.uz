// components/custom/details/question/question-input.tsx yangilangan variant
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

const QuestionComponent = ({ node, updateAttributes, deleteNode }) => {
  return (
    <NodeViewWrapper className="inline-block mx-1 group relative align-middle">
      <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-1 gap-1 transition-all hover:border-main shadow-sm">
        {/* Savol raqami - endi tahrirlasa bo'ladi */}
        <input
          type="text"
          className="w-7 h-7 bg-white border border-blue-100 text-main text-[10px] font-bold rounded-md text-center outline-none focus:ring-2 focus:ring-main focus:border-transparent"
          value={node.attrs.number}
          required
          onChange={(e) => updateAttributes({ number: e.target.value })}
          title="Question Number"
        />

        {/* To'g'ri javob */}
        <input
          required
          className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 w-28 placeholder:text-blue-300 px-1"
          placeholder="Correct answer"
          value={node.attrs.answer}
          onChange={(e) => updateAttributes({ answer: e.target.value })}
        />

        {/* O'chirish tugmasi */}
        <button
          onClick={() => deleteNode()}
          className="text-gray-400 hover:text-red-500 px-1 font-bold text-lg leading-none"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const QuestionInput = Node.create({
  name: "questionInput",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      answer: { default: "" },
      number: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "question-input" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["question-input", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(QuestionComponent);
  },
  addCommands() {
    return {
      insertQuestionInput:
        () =>
        ({ editor, tr }) => {
          let maxNumber = 0;

          // Editor ichidagi barcha questionInput larni aylanamiz
          editor.state.doc.descendants((node) => {
            if (node.type.name === "questionInput") {
              const num = parseInt(node.attrs.number);
              if (!isNaN(num)) {
                maxNumber = Math.max(maxNumber, num);
              }
            }
          });

          const nextNumber = maxNumber + 1;

          editor
            .chain()
            .insertContent({
              type: "questionInput",
              attrs: {
                number: String(nextNumber),
                answer: "",
              },
            })
            .run();

          return true;
        },
    };
  },
});
