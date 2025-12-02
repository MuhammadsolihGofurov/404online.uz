import React, { useState, useRef, useEffect, memo } from "react";
import { useIntl } from "react-intl";
import { RichText } from "@/components/ui/RichText";

export const EssayRenderer = memo(({ question, value, onChange, disabled }) => {
  const intl = useIntl();
  const { prompt, question_number, content } = question;
  const minWords = Number(content?.min_word_count) || null;
  
  // Local state for performance
  const [text, setText] = useState(value?.text || "");
  const isFocusedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const initialValueRef = useRef(value?.text);

  // CRITICAL FIX: BLOCK server updates if user has touched the textarea
  useEffect(() => {
    // ONLY sync on initial mount
    if (initialValueRef.current === undefined && value?.text !== undefined) {
      initialValueRef.current = value?.text;
      setText(value?.text || "");
      return;
    }

    // NEVER sync if focused or dirty - user is actively editing
    if (isFocusedRef.current || isDirtyRef.current) {
      return; // ← KILL THE SYNC
    }

    // Only sync if value actually changed from server
    const serverText = value?.text || "";
    if (serverText !== text) {
      setText(serverText);
    }
  }, [value?.text, text]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    isDirtyRef.current = true; // Mark as dirty - BLOCKS server updates
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const currentText = text || "";
    const serverText = value?.text || "";
    
    if (currentText !== serverText) {
      onChange({ text: currentText });
      // Keep dirty flag for 2 seconds to prevent race condition
      setTimeout(() => {
        isDirtyRef.current = false;
      }, 2000);
    } else {
      isDirtyRef.current = false;
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const meetsMin = !minWords || wordCount >= minWords;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">
          Q{question_number}
        </span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-16 space-y-3">
        <textarea
          rows={15}
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={intl.formatMessage({ id: "Write your essay response here..." })}
          className={`w-full px-4 py-3 text-base border rounded-2xl focus:outline-none focus:ring-4 transition-shadow ${
            disabled
              ? "bg-gray-100 text-gray-500"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
          }`}
        />
        <div className={`text-sm font-semibold flex justify-end ${
          meetsMin ? "text-emerald-600" : "text-orange-600"
        }`}>
          <span>
            {intl.formatMessage({ id: "Word Count" })}: {wordCount}
            {minWords ? ` / ${intl.formatMessage({ id: "Min" })}: ${minWords}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
});

EssayRenderer.displayName = "EssayRenderer";

