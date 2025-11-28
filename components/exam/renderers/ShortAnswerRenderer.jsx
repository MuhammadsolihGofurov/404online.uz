import React, { memo } from "react";
import { RichText } from "@/components/ui/RichText";
import { LocalInput } from "./LocalInput";

export const ShortAnswerRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, question_number } = question;
  const qVal = value?.value || "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">Q{question_number}</span>
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
          <RichText content={prompt} />
        </div>
      </div>
      <div className="ml-16">
        <LocalInput
          value={qVal}
          onChange={(val) => onChange({ value: val })}
          disabled={disabled}
          placeholder="Type your answer..."
          className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
});

ShortAnswerRenderer.displayName = "ShortAnswerRenderer";

