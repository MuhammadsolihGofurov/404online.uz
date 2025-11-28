import React, { useMemo, useCallback, memo } from "react";
import { RichText } from "@/components/ui/RichText";
import { BLANK_REGEX } from "@/components/dashboard/mocks/fourth-step/utils/questionUtils";
import { LocalInput } from "./LocalInput";

export const SummaryRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, content, question_number } = question;
  const text = content?.text || "";
  const currentBlanks = value?.blanks || value?.values || {};

  const handleBlankChange = useCallback((blankId, val) => {
    const newBlanks = { ...currentBlanks, [blankId]: val };
    onChange({ values: newBlanks });
  }, [currentBlanks, onChange]);

  // Render parts
  const renderContent = useMemo(() => {
    if (!text) return null;
    
    const parts = [];
    let lastIndex = 0;
    const regex = new RegExp(BLANK_REGEX.source, 'g');
    let match;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${idx++}`} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex, match.index) }} />
        );
      }
      
      const blankId = match[1]?.trim();
      const val = currentBlanks[blankId] || "";

      parts.push(
        <LocalInput
          key={`input-${blankId}`}
          value={val}
          onChange={(v) => handleBlankChange(blankId, v)}
          disabled={disabled}
          placeholder={blankId}
          className="inline-block min-w-[120px] mx-1 px-2 py-1 border-b-2 border-blue-500 bg-blue-50/50 focus:bg-white focus:outline-none text-center font-bold text-blue-800 transition-colors"
        />
      );

      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${idx++}`} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex) }} />
      );
    }

    return parts;
  }, [text, currentBlanks, disabled, handleBlankChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">Q{question_number}</span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>
      <div className="ml-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm leading-loose text-gray-800 text-lg font-serif whitespace-pre-wrap">
        {renderContent}
      </div>
    </div>
  );
});

SummaryRenderer.displayName = "SummaryRenderer";

