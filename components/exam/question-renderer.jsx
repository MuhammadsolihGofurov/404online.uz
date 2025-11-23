import React from "react";
import { useIntl } from "react-intl";
import { RichText } from "@/components/ui/RichText";

/**
 * QuestionRenderer
 * 
 * Polymorphic component that renders different input types based on question_type.
 * Handles: MCQ_SINGLE, MCQ_MULTIPLE, TFNG, SHORT_ANSWER, and more.
 */
export function QuestionRenderer({ question, value, onChange, disabled = false }) {
  const intl = useIntl();
  const { question_type, prompt, content, question_number } = question;

  // Render based on question type
  switch (question_type) {
    case "MCQ_SINGLE":
      return (
        <MCQSingleRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "MCQ_MULTIPLE":
      return (
        <MCQMultipleRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "TFNG":
      return (
        <TFNGRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "SHORT_ANSWER":
      return (
        <ShortAnswerRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "SUMMARY_FILL_BLANKS":
      return (
        <SummaryFillBlanksRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "SUMMARY_DRAG_DROP":
      return (
        <SummaryDragDropRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "MATCHING_DRAG_DROP":
    case "MATCHING_TABLE_CLICK":
      return (
        <MatchingRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "TABLE_COMPLETION":
      return (
        <TableCompletionRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "FLOWCHART_COMPLETION":
      return (
        <FlowchartCompletionRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "MAP_LABELLING":
      return (
        <MapLabellingRenderer
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {intl.formatMessage(
              { id: "Unsupported question type: {type}" },
              { type: question_type }
            )}
          </p>
        </div>
      );
  }
}

/**
 * MCQ_SINGLE: Radio buttons for single selection
 * Supports grouped questions (e.g., Q1-5) with multiple sub-questions
 */
function MCQSingleRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number, question_number_start, question_number_end } = question;
  const options = content?.options || [];

  // Check if using independent options mode
  const useSameOptions = content?.use_same_options !== false; // Default to true
  const questions = content?.questions || [];

  // Normalize options (handle both string arrays and object arrays)
  const normalizeOptions = (opts) => {
    return opts.map((opt, idx) => {
      if (typeof opt === "string") {
        // Legacy: string format (e.g., "A) Option Text")
        return { key: opt, text: opt, value: opt };
      } else if (typeof opt === "object" && opt !== null) {
        // Object format: {id, text, value} or {key, text} or {text, value}
        return {
          key: opt.value || opt.id || opt.key || String(idx),
          text: opt.text || String(opt),
          value: opt.value || opt.id || opt.key || String(idx),
          id: opt.id
        };
      } else {
        // Fallback: use index as key
        return { key: String(idx), text: String(opt), value: String(idx) };
      }
    });
  };

  const normalizedOptions = normalizeOptions(options);

  // Check if this is a grouped question (range)
  const isGrouped = question_number_end && question_number_end > question_number_start;
  const statements = content?.statements || []; // Optional sub-question statements

  // For grouped questions, use nested values structure
  if (isGrouped) {
    const currentValues = value?.values || {};
    const questionRange = [];
    for (let i = question_number_start; i <= question_number_end; i++) {
      questionRange.push(i);
    }

    return (
      <div className="space-y-4">
        {/* Main prompt displayed once */}
        <div className="flex items-start gap-3">
          <span className="font-semibold text-gray-700 min-w-[40px]">
            Q{question_number_start}-{question_number_end}
          </span>
          <div className="text-gray-900 flex-1">
            <RichText content={prompt} />
          </div>
        </div>

        {/* Individual sub-questions */}
        <div className="ml-[52px] space-y-4">
          {questionRange.map((qNum) => {
            const currentValue = currentValues[String(qNum)] || "";
            const statement = statements[qNum - question_number_start] || null; // Get statement for this sub-question

            // Get options for this question (independent mode) or use shared options
            const questionData = !useSameOptions 
              ? questions.find(q => q.id === String(qNum))
              : null;
            const questionOptions = questionData?.options 
              ? normalizeOptions(questionData.options)
              : normalizedOptions;
            const questionText = questionData?.text || statement;

            return (
              <div key={qNum} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[40px]">
                    Q{qNum}
                  </span>
                  {questionText && (
                    <div className="text-gray-800 flex-1">
                      <RichText content={questionText} />
                    </div>
                  )}
                </div>
                <div className="space-y-3 ml-[52px]">
                  {questionOptions.map((option) => (
                    <label
                      key={option.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        currentValue === option.value || currentValue === option.key
                          ? "border-main bg-main/5"
                          : "border-gray-200 hover:border-gray-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}-${qNum}`}
                        value={option.value}
                        checked={currentValue === option.value || currentValue === option.key}
                        onChange={(e) => {
                          if (!disabled) {
                            const newValues = { ...currentValues };
                            newValues[String(qNum)] = e.target.value;
                            onChange({ values: newValues });
                          }
                        }}
                        disabled={disabled}
                        className="w-5 h-5 text-main focus:ring-main cursor-pointer"
                      />
                      {option.value && option.value !== option.text && (
                        <span className="font-medium text-gray-700 min-w-[30px]">{option.value}</span>
                      )}
                      <span className="text-gray-600 flex-1">
                        <RichText content={option.text} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Single question (non-grouped) - original behavior
  const currentValue = value?.value || "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="space-y-3 ml-[52px]">
        {normalizedOptions.map((option) => (
          <label
            key={option.key}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              currentValue === option.key
                ? "border-main bg-main/5"
                : "border-gray-200 hover:border-gray-300"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.value}
              checked={currentValue === option.value || currentValue === option.key}
              onChange={(e) => {
                if (!disabled) {
                  onChange({ value: e.target.value });
                }
              }}
              disabled={disabled}
              className="w-5 h-5 text-main focus:ring-main cursor-pointer"
            />
            {option.value && option.value !== option.text && (
              <span className="font-medium text-gray-700 min-w-[30px]">{option.value}</span>
            )}
            <span className="text-gray-600 flex-1">
              <RichText content={option.text} />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * MCQ_MULTIPLE: Checkboxes for multiple selection
 */
function MCQMultipleRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const options = content?.options || [];
  const maxChoices = content?.max_choices || null;

  // Normalize options (handle both string arrays and object arrays)
  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      // Legacy: string format (e.g., "A) Option Text")
      return { key: opt, text: opt, value: opt };
    } else if (typeof opt === "object" && opt !== null) {
      // Object format: {id, text, value} or {key, text} or {text, value}
      return {
        key: opt.value || opt.id || opt.key || String(idx),
        text: opt.text || String(opt),
        value: opt.value || opt.id || opt.key || String(idx),
        id: opt.id
      };
    } else {
      // Fallback: use index as key
      return { key: String(idx), text: String(opt), value: String(idx) };
    }
  });

  const currentValues = Array.isArray(value?.value) ? value.value : [];

  const handleToggle = (optionValue) => {
    if (disabled) return;

    let newValues;
    if (currentValues.includes(optionValue)) {
      // Remove if already selected
      newValues = currentValues.filter((v) => v !== optionValue);
    } else {
      // Add if not selected (check max_choices limit)
      if (maxChoices && currentValues.length >= maxChoices) {
        return; // Don't add if max reached
      }
      newValues = [...currentValues, optionValue];
    }

    onChange({ value: newValues });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="flex-1">
          <RichText content={prompt} />
          {maxChoices && (
            <p className="text-sm text-gray-500 mt-1">
              {intl.formatMessage(
                { id: "Select up to {max} answers" },
                { max: maxChoices }
              )}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 ml-[52px]">
        {normalizedOptions.map((option) => {
          const isSelected = currentValues.includes(option.value) || currentValues.includes(option.key);
          const isDisabled =
            disabled ||
            (!isSelected && maxChoices && currentValues.length >= maxChoices);

          return (
            <label
              key={option.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected
                  ? "border-main bg-main/5"
                  : "border-gray-200 hover:border-gray-300"
              } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                disabled={isDisabled}
                className="w-5 h-5 text-main focus:ring-main rounded cursor-pointer"
              />
              {option.value && option.value !== option.text && (
                <span className="font-medium text-gray-700 min-w-[30px]">{option.value}</span>
              )}
              <span className="text-gray-600 flex-1">
                <RichText content={option.text} />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TFNG: True/False/Not Given - Radio buttons
 * Supports grouped questions (e.g., Q1-5) with multiple sub-questions
 */
function TFNGRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, question_number, question_number_start, question_number_end, content } = question;

  const options = [
    { key: "TRUE", label: "True" },
    { key: "FALSE", label: "False" },
    { key: "NOT GIVEN", label: "Not Given" },
  ];

  // Check if this is a grouped question (range)
  const isGrouped = question_number_end && question_number_end > question_number_start;
  const statements = content?.statements || []; // Optional sub-question statements

  // For grouped questions, use nested values structure
  if (isGrouped) {
    const currentValues = value?.values || {};
    const questionRange = [];
    for (let i = question_number_start; i <= question_number_end; i++) {
      questionRange.push(i);
    }

    return (
      <div className="space-y-4">
        {/* Main prompt displayed once */}
        <div className="flex items-start gap-3">
          <span className="font-semibold text-gray-700 min-w-[40px]">
            Q{question_number_start}-{question_number_end}
          </span>
          <div className="text-gray-900 flex-1">
            <RichText content={prompt} />
          </div>
        </div>

        {/* Individual sub-questions */}
        <div className="ml-[52px] space-y-4">
          {questionRange.map((qNum) => {
            const currentValue = currentValues[String(qNum)] || "";
            const statement = statements[qNum - question_number_start] || null; // Get statement for this sub-question

            return (
              <div key={qNum} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[40px]">
                    Q{qNum}
                  </span>
                  {statement && (
                    <div className="text-gray-800 flex-1">
                      <RichText content={statement} />
                    </div>
                  )}
                </div>
                <div className="flex gap-4 ml-[52px]">
                  {options.map((option) => (
                    <label
                      key={option.key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                        currentValue.toUpperCase() === option.key.toUpperCase()
                          ? "border-main bg-main/5"
                          : "border-gray-200 hover:border-gray-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}-${qNum}`}
                        value={option.key}
                        checked={currentValue.toUpperCase() === option.key.toUpperCase()}
                        onChange={(e) => {
                          if (!disabled) {
                            const newValues = { ...currentValues };
                            newValues[String(qNum)] = e.target.value;
                            onChange({ values: newValues });
                          }
                        }}
                        disabled={disabled}
                        className="w-4 h-4 text-main focus:ring-main cursor-pointer"
                      />
                      <span className="font-medium text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Single question (non-grouped) - original behavior
  const currentValue = value?.value || "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="flex gap-4 ml-[52px]">
        {options.map((option) => (
          <label
            key={option.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
              currentValue.toUpperCase() === option.key.toUpperCase()
                ? "border-main bg-main/5"
                : "border-gray-200 hover:border-gray-300"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.key}
              checked={currentValue.toUpperCase() === option.key.toUpperCase()}
              onChange={(e) => {
                if (!disabled) {
                  onChange({ value: e.target.value });
                }
              }}
              disabled={disabled}
              className="w-4 h-4 text-main focus:ring-main cursor-pointer"
            />
            <span className="font-medium text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * SHORT_ANSWER: Text input field
 */
function ShortAnswerRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const wordLimit = content?.answer_length_limit || content?.word_limit || null;
  const instructions = content?.instructions || "";

  const currentValue = value?.value || "";

  // Count words
  const wordCount = currentValue.trim()
    ? currentValue.trim().split(/\s+/).length
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="flex-1">
          <RichText content={prompt} />
          {instructions && (
            <div className="text-sm text-gray-500 mt-1 italic">
              <RichText content={instructions} />
            </div>
          )}
        </div>
      </div>

      <div className="ml-[52px]">
        <input
          type="text"
          value={currentValue}
          onChange={(e) => {
            if (!disabled) {
              onChange({ value: e.target.value });
            }
          }}
          disabled={disabled}
          placeholder={intl.formatMessage({ id: "Type your answer here" })}
          className={`w-full px-4 py-3 rounded-lg border-2 text-base ${
            wordLimit && wordCount > wordLimit
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-main"
          } focus:outline-none focus:ring-2 focus:ring-main/20 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}
        />
        {wordLimit && (
          <p
            className={`text-xs mt-1 ${
              wordCount > wordLimit ? "text-red-600" : "text-gray-500"
            }`}
          >
            {wordCount} / {wordLimit}{" "}
            {intl.formatMessage({ id: "words" })}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SUMMARY_FILL_BLANKS: Multiple text inputs for blanks
 */
function SummaryFillBlanksRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const summaryType = content?.summary_type || "story";
  const items = content?.items || [];
  const rows = content?.rows || [];
  const wordLimit = content?.word_limit || null;
  
  // Legacy support: if items array doesn't exist, fall back to text-based rendering
  const text = content?.text || "";
  const hasLegacyFormat = !items.length && text && !rows.length;

  const currentBlanks = value?.blanks || value?.values || {};

  const handleBlankChange = (blankId, blankValue) => {
    if (disabled) return;

    // For new format, use values object
    const newValues = { ...currentBlanks };
    newValues[blankId] = blankValue;
    onChange({ values: newValues });
  };

  // Render Story Mode (Rich Text HTML)
  const renderStoryMode = () => {
    if (!text) return null;
    
    const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
    const blankIds = blankMatches.map((match) =>
      match.replace(/___\(([^)]+)\)___/, "$1")
    );

    const containsHtml = /<[a-z][\s\S]*>/i.test(text);
    
    if (!containsHtml) {
      // Plain text mode
      let parts = text.split(/(___\([^)]+)\)___)/);
      return parts.map((part, idx) => {
        const blankMatch = part.match(/___\(([^)]+)\)___/);
        if (blankMatch) {
          const blankId = blankMatch[1];
          const blankValue = currentBlanks[blankId] || "";
          return (
            <input
              key={idx}
              type="text"
              value={blankValue}
              onChange={(e) => handleBlankChange(blankId, e.target.value)}
              disabled={disabled}
              placeholder={blankId}
              className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
                disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
              }`}
            />
          );
        }
        return <span key={idx}>{part}</span>;
      });
    }

    // HTML mode: Parse HTML and create React elements with inputs
    const placeholderRegex = /___\(([^)]+)\)___/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    const matches = [];
    while ((match = placeholderRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        blankId: match[1],
        fullMatch: match[0]
      });
    }

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      
      if (currentMatch.index > lastIndex) {
        const htmlBefore = text.substring(lastIndex, currentMatch.index);
        parts.push(
          <span 
            key={`html-${keyCounter++}`}
            dangerouslySetInnerHTML={{ __html: htmlBefore }}
          />
        );
      }

      const blankValue = currentBlanks[currentMatch.blankId] || "";
      parts.push(
        <input
          key={`input-${keyCounter++}`}
          type="text"
          value={blankValue}
          onChange={(e) => handleBlankChange(currentMatch.blankId, e.target.value)}
          disabled={disabled}
          placeholder={currentMatch.blankId}
          className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
          }`}
        />
      );

      lastIndex = currentMatch.index + currentMatch.length;
    }

    if (lastIndex < text.length) {
      const htmlAfter = text.substring(lastIndex);
      parts.push(
        <span 
          key={`html-${keyCounter++}`}
          dangerouslySetInnerHTML={{ __html: htmlAfter }}
        />
      );
    }

    return <>{parts}</>;
  };

  // Render List Mode (Bullet or Numbered)
  const renderListMode = () => {
    if (!rows.length) return null;
    
    const isNumbered = summaryType === "numbered";
    const elements = [];
    let listItems = []; // Track items in current list
    let listKey = null; // Track the key for the current list
    let questionCounter = 0; // Track question number for numbered lists

    rows.forEach((row, index) => {
      const rowType = row.type || "question"; // Default to question for backward compatibility
      
      if (rowType === "heading" || rowType === "subheading") {
        // Close any open list before rendering heading
        if (listItems.length > 0) {
          const ListTag = isNumbered ? "ol" : "ul";
          const listClassName = isNumbered 
            ? "list-decimal list-inside space-y-2 my-2"
            : "list-disc list-inside space-y-2 my-2";
          
          elements.push(
            <ListTag key={listKey || `list-${index}`} className={listClassName}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          listKey = null;
        }
        
        // Render heading
        const HeadingTag = rowType === "heading" ? "h4" : "h5";
        const headingClassName = rowType === "heading"
          ? "mt-4 mb-2 text-base font-bold text-gray-900"
          : "mt-3 mb-2 text-sm font-semibold text-gray-800";
        
        elements.push(
          <HeadingTag key={`heading-${index}`} className={headingClassName}>
            {row.text || ""}
          </HeadingTag>
        );
      } else if (rowType === "text") {
        // Text-only row (info row without blank) - add to current list
        // Start new list if needed
        if (!listKey) {
          listKey = `list-${index}`;
        }
        
        listItems.push(
          <li key={`text-${index}`} className="text-gray-800 my-1">
            {row.text || ""}
          </li>
        );
      } else if (rowType === "question") {
        // Question row - add to current list
        const blankId = row.blank_id || row.id;
        const blankValue = currentBlanks[blankId] || "";
        
        if (isNumbered) {
          questionCounter++;
        }
        
        // Start new list if needed
        if (!listKey) {
          listKey = `list-${index}`;
        }
        
        listItems.push(
          <li key={`item-${index}`} className="text-gray-800 my-1">
            <span className="inline-flex items-center gap-1 flex-wrap">
              {row.pre_text && <span>{row.pre_text}</span>}
              <input
                type="text"
                value={blankValue}
                onChange={(e) => handleBlankChange(blankId, e.target.value)}
                disabled={disabled}
                placeholder={`Q${blankId}`}
                className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
                  disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
                }`}
              />
              {row.post_text && <span>{row.post_text}</span>}
            </span>
          </li>
        );
      }
    });

    // Close any remaining open list
    if (listItems.length > 0) {
      const ListTag = isNumbered ? "ol" : "ul";
      const listClassName = isNumbered 
        ? "list-decimal list-inside space-y-2 my-2"
        : "list-disc list-inside space-y-2 my-2";
      
      elements.push(
        <ListTag key={listKey || "list-final"} className={listClassName}>
          {listItems}
        </ListTag>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  };

  // New structured format: Render items array
  const renderStructuredItems = () => {
    if (!items.length) return null;

    const elements = [];
    let listItems = []; // Track items in current bullet list
    let listKey = null; // Track the key for the current list

    items.forEach((item, index) => {
      if (item.type === "heading") {
        // Close any open list
        if (listItems.length > 0) {
          elements.push(
            <ul key={listKey} className="list-disc list-inside space-y-1 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
          listKey = null;
        }
        elements.push(
          <h3 key={`heading-${index}`} className="mt-4 mb-2 text-lg font-bold text-gray-900">
            <RichText content={item.text} />
          </h3>
        );
      } else if (item.type === "subheading") {
        // Close any open list
        if (listItems.length > 0) {
          elements.push(
            <ul key={listKey} className="list-disc list-inside space-y-1 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
          listKey = null;
        }
        elements.push(
          <h4 key={`subheading-${index}`} className="mt-3 mb-2 text-base font-semibold text-gray-800">
            <RichText content={item.text} />
          </h4>
        );
      } else if (item.type === "question") {
        const blankValue = currentBlanks[item.id] || "";
        // Render pre and post text - handle both plain text and HTML
        const renderText = (text) => {
          if (!text) return null;
          // Check if text contains HTML tags
          if (/<[a-z][\s\S]*>/i.test(text)) {
            return <RichText content={text} />;
          }
          // Plain text
          return <span>{text}</span>;
        };
        
        const questionRow = (
          <span className="inline-flex items-center gap-1 flex-wrap">
            {item.pre && renderText(item.pre)}
            <input
              type="text"
              value={blankValue}
              onChange={(e) => handleBlankChange(item.id, e.target.value)}
              disabled={disabled}
              placeholder={`Q${item.id}`}
              className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
                disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
              }`}
            />
            {item.post && renderText(item.post)}
          </span>
        );

        if (item.is_bullet) {
          // Add to current list or start new one
          if (!listKey) {
            listKey = `list-${index}`;
          }
          listItems.push(
            <li key={`item-${index}`} className="text-gray-800">
              {questionRow}
            </li>
          );
        } else {
          // Close any open list
          if (listItems.length > 0) {
            elements.push(
              <ul key={listKey} className="list-disc list-inside space-y-1 my-2">
                {listItems}
              </ul>
            );
            listItems = [];
            listKey = null;
          }
          // Regular paragraph
          elements.push(
            <p key={`para-${index}`} className="my-2 text-gray-800">
              {questionRow}
            </p>
          );
        }
      }
    });

    // Close any remaining open list
    if (listItems.length > 0) {
      elements.push(
        <ul key={listKey || "list-final"} className="list-disc list-inside space-y-1 my-2">
          {listItems}
        </ul>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  };

  // Legacy format: Render text with placeholders (backward compatibility)
  const renderLegacyText = () => {
    if (!hasLegacyFormat) return null;

    const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
    const blankIds = blankMatches.map((match) =>
      match.replace(/___\(([^)]+)\)___/, "$1")
    );

    const containsHtml = /<[a-z][\s\S]*>/i.test(text);
    
    if (!containsHtml) {
      // Plain text mode
      let parts = text.split(/(___\([^)]+)\)___)/);
      return parts.map((part, idx) => {
        const blankMatch = part.match(/___\(([^)]+)\)___/);
        if (blankMatch) {
          const blankId = blankMatch[1];
          const blankIndex = blankIds.indexOf(blankId);
          const blankValue = currentBlanks[blankIndex] || currentBlanks[blankId] || "";

          return (
            <input
              key={idx}
              type="text"
              value={blankValue}
              onChange={(e) => handleBlankChange(blankId, e.target.value)}
              disabled={disabled}
              placeholder={blankId}
              className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
                disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
              }`}
            />
          );
        }
        return <span key={idx}>{part}</span>;
      });
    }

    // HTML mode: Parse HTML and create React elements with inputs
    const placeholderRegex = /___\(([^)]+)\)___/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    const matches = [];
    while ((match = placeholderRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        blankId: match[1],
        fullMatch: match[0]
      });
    }

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      
      if (currentMatch.index > lastIndex) {
        const htmlBefore = text.substring(lastIndex, currentMatch.index);
        parts.push(
          <span 
            key={`html-${keyCounter++}`}
            dangerouslySetInnerHTML={{ __html: htmlBefore }}
          />
        );
      }

      const blankIndex = blankIds.indexOf(currentMatch.blankId);
      const blankValue = currentBlanks[blankIndex] || currentBlanks[currentMatch.blankId] || "";
      parts.push(
        <input
          key={`input-${keyCounter++}`}
          type="text"
          value={blankValue}
          onChange={(e) => handleBlankChange(currentMatch.blankId, e.target.value)}
          disabled={disabled}
          placeholder={currentMatch.blankId}
          className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-main focus:outline-none focus:border-main/80 text-center ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-transparent"
          }`}
        />
      );

      lastIndex = currentMatch.index + currentMatch.length;
    }

    if (lastIndex < text.length) {
      const htmlAfter = text.substring(lastIndex);
      parts.push(
        <span 
          key={`html-${keyCounter++}`}
          dangerouslySetInnerHTML={{ __html: htmlAfter }}
        />
      );
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-[52px] p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-800 leading-relaxed">
          {summaryType === "story" 
            ? renderStoryMode() 
            : summaryType === "bullet" || summaryType === "numbered"
            ? renderListMode()
            : items.length > 0 
            ? renderStructuredItems() 
            : renderLegacyText()}
        </div>
        {wordLimit && (
          <p className="text-xs text-gray-500 mt-2">
            {intl.formatMessage(
              { id: "Maximum {limit} words per blank" },
              { limit: wordLimit }
            )}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SUMMARY_DRAG_DROP: Summary with draggable word bank
 */
function SummaryDragDropRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const text = content?.text || "";
  const wordBank = content?.word_bank || [];
  const wordLimit = content?.word_limit || null;

  // Extract blank IDs from text (e.g., ___(1)___, ___(A)___)
  const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
  const blankIds = blankMatches.map((match) =>
    match.replace(/___\(([^)]+)\)___/, "$1")
  );

  const currentBlanks = value?.blanks || value?.values || {};
  
  // Normalize word bank: handle both string and object formats
  const normalizedWordBank = wordBank.map((word, idx) => {
    if (typeof word === "string") {
      return { id: `word-${idx}`, text: word, value: word };
    } else if (typeof word === "object" && word !== null) {
      return {
        id: word.id || `word-${idx}`,
        text: word.text || word.value || String(word),
        value: word.value || word.id || word.text || String(word)
      };
    }
    return { id: `word-${idx}`, text: String(word), value: String(word) };
  });
  
  // Calculate available words (words not currently used in blanks)
  const usedWords = Object.values(currentBlanks).filter(Boolean);
  const availableWords = normalizedWordBank.filter((word) => {
    // Check if word.value or word.id is in usedWords
    return !usedWords.includes(word.value) && !usedWords.includes(word.id);
  });

  const handleBlankSelect = (blankId, word) => {
    if (disabled) return;

    const newBlanks = { ...currentBlanks };
    // Assign word to blank (overwrites previous if any)
    newBlanks[blankId] = word;
    onChange({ blanks: newBlanks });
  };

  const handleRemoveBlank = (blankId) => {
    if (disabled) return;

    const newBlanks = { ...currentBlanks };
    delete newBlanks[blankId];
    onChange({ blanks: newBlanks });
  };

  // Render text with drop zones for blanks
  const renderTextWithBlanks = () => {
    let parts = text.split(/(___\([^)]+\)___)/);
    return parts.map((part, idx) => {
      const blankMatch = part.match(/___\(([^)]+)\)___/);
      if (blankMatch) {
        const blankId = blankMatch[1];
        const blankValue = currentBlanks[blankId] || "";

        return (
          <span key={idx} className="inline-block mx-1">
            {blankValue ? (
              <span
                className="inline-block px-3 py-1 bg-main text-white rounded-lg cursor-pointer hover:bg-main/90"
                onClick={() => !disabled && handleRemoveBlank(blankId)}
                title={intl.formatMessage({ id: "Click to remove" })}
              >
                {blankValue}
              </span>
            ) : (
              <span className="inline-block min-w-[120px] px-2 py-1 border-2 border-dashed border-gray-300 rounded text-gray-400 text-center">
                {blankId}
              </span>
            )}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-[52px] space-y-4">
        {/* Word Bank */}
        {wordBank.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {intl.formatMessage({ id: "Word Bank" })}:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableWords.map((word, idx) => {
                const wordText = typeof word === "object" && word !== null
                  ? (word.text || word.value || String(word))
                  : String(word);
                const wordValue = typeof word === "object" && word !== null
                  ? (word.value || word.id || word.text || String(word))
                  : String(word);
                
                return (
                  <button
                    key={word.id || idx}
                    type="button"
                    onClick={() => {
                      // Find first empty blank
                      const emptyBlank = blankIds.find(
                        (id) => !currentBlanks[id]
                      );
                      if (emptyBlank) {
                        handleBlankSelect(emptyBlank, wordValue);
                      }
                    }}
                    disabled={disabled || !blankIds.some((id) => !currentBlanks[id])}
                    className={`px-3 py-1 rounded-lg border-2 transition-colors ${
                      disabled || !blankIds.some((id) => !currentBlanks[id])
                        ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100"
                        : "border-blue-300 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer"
                    }`}
                  >
                    <RichText content={wordText} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Text with Blanks */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-800 leading-relaxed">
            {renderTextWithBlanks()}
          </div>
          {wordLimit && (
            <p className="text-xs text-gray-500 mt-2">
              {intl.formatMessage(
                { id: "Maximum {limit} words per blank" },
                { limit: wordLimit }
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MATCHING: Simple select-based matching (simplified version)
 * Supports asymmetric lists where List B can have more items than List A (distractors)
 */
function MatchingRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const listA = content?.list_a || [];
  const listB = content?.list_b || [];

  const currentMatches = value?.matches || value?.pairs || [];

  // Get used option IDs to identify unused distractors
  const usedOptionIds = new Set(currentMatches.map(m => m.to).filter(Boolean));

  const handleMatch = (itemAId, itemBId) => {
    if (disabled) return;

    const newMatches = currentMatches.filter((m) => m.from !== itemAId);
    if (itemBId) {
      newMatches.push({ from: itemAId, to: itemBId });
    }

    onChange({ matches: newMatches });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-[52px] space-y-4">
        {/* List A items with matching dropdowns */}
        <div className="space-y-3">
          {listA.map((itemA) => {
            // Normalize itemA: handle both object and string formats
            const itemAId = typeof itemA === "object" && itemA !== null
              ? (itemA.id || itemA.key || itemA.value)
              : String(itemA);
            const itemAText = typeof itemA === "object" && itemA !== null
              ? (itemA.text || itemA.label || String(itemA))
              : String(itemA);
            const itemALabel = typeof itemA === "object" && itemA !== null && itemA.id
              ? itemA.id
              : null;
            
            const currentMatch = currentMatches.find((m) => m.from === itemAId);

            return (
              <div
                key={itemAId}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                {itemALabel && (
                  <span className="font-medium text-gray-700 min-w-[40px]">
                    {itemALabel}
                  </span>
                )}
                <span className="text-gray-800 flex-1">
                  <RichText content={itemAText} />
                </span>
                <select
                  value={currentMatch?.to || ""}
                  onChange={(e) => handleMatch(itemAId, e.target.value)}
                  disabled={disabled}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-main min-w-[200px]"
                >
                  <option value="">
                    {intl.formatMessage({ id: "Select match" })}
                  </option>
                  {listB.map((itemB) => {
                    // Normalize itemB: handle both object and string formats
                    const itemBId = typeof itemB === "object" && itemB !== null
                      ? (itemB.id || itemB.key || itemB.value)
                      : String(itemB);
                    const itemBText = typeof itemB === "object" && itemB !== null
                      ? (itemB.text || itemB.label || String(itemB))
                      : String(itemB);
                    const itemBLabel = typeof itemB === "object" && itemB !== null && itemB.id
                      ? itemB.id
                      : null;
                    
                    // Display format: "ID: Text" if ID exists, otherwise just text
                    const displayText = itemBLabel && itemBLabel !== itemBText
                      ? `${itemBLabel}: ${itemBText}`
                      : itemBText;
                    
                    return (
                      <option key={itemBId} value={itemBId}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>

        {/* Show unused options (distractors) if any */}
        {listB.length > listA.length && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">
              Unused Options (Distractors):
            </p>
            <div className="space-y-1">
              {listB.map((itemB) => {
                const itemBId = typeof itemB === "object" && itemB !== null
                  ? (itemB.id || itemB.key || itemB.value)
                  : String(itemB);
                const itemBText = typeof itemB === "object" && itemB !== null
                  ? (itemB.text || itemB.label || String(itemB))
                  : String(itemB);
                const itemBLabel = typeof itemB === "object" && itemB !== null && itemB.id
                  ? itemB.id
                  : null;
                
                const isUsed = usedOptionIds.has(itemBId);
                if (isUsed) return null;
                
                const displayText = itemBLabel && itemBLabel !== itemBText
                  ? `${itemBLabel}: ${itemBText}`
                  : itemBText;
                
                return (
                  <p key={itemBId} className="text-xs text-blue-700">
                    • {displayText}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TABLE_COMPLETION: Table with input fields
 */
function TableCompletionRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const columns = content?.columns || [];
  const rows = content?.rows || [];

  const currentValues = value?.values || {};

  const handleCellChange = (rowId, colIndex, cellValue) => {
    if (disabled) return;

    const newValues = { ...currentValues };
    const key = `${rowId}_col${colIndex}`;
    if (cellValue) {
      newValues[key] = cellValue;
    } else {
      delete newValues[key];
    }

    onChange({ values: newValues });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="text-gray-900 flex-1">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-[52px] overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const colText = typeof col === "object" && col !== null
                  ? (col.text || col.label || String(col))
                  : String(col);
                return (
                  <th
                    key={col.id || idx}
                    className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-gray-700 text-left"
                  >
                    <RichText content={colText} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = typeof row === "object" && row !== null
                ? (row.id || String(row))
                : String(row);
              const cells = typeof row === "object" && row !== null
                ? (row.cells || [])
                : [];

              return (
                <tr key={rowId}>
                  {cells.map((cell, colIdx) => {
                    const isBlank = cell === "___" || cell === "";
                    const cellKey = `${rowId}_col${colIdx}`;
                    const cellValue = currentValues[cellKey] || "";

                    return (
                      <td
                        key={colIdx}
                        className="border border-gray-300 px-4 py-2"
                      >
                        {isBlank ? (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) =>
                              handleCellChange(rowId, colIdx, e.target.value)
                            }
                            disabled={disabled}
                            placeholder={intl.formatMessage({ id: "Answer" })}
                            className="w-full px-2 py-1 border-b-2 border-main focus:outline-none focus:border-main/80"
                          />
                        ) : (
                          <span className="text-gray-700">{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * FLOWCHART_COMPLETION: Flowchart with input fields for blanks
 */
function FlowchartCompletionRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const steps = content?.steps || [];
  const wordLimit = content?.allowed_words || "";

  const currentValues = value?.values || {};

  const handleStepChange = (stepId, stepValue) => {
    if (disabled) return;

    const newValues = { ...currentValues };
    if (stepValue) {
      newValues[stepId] = stepValue;
    } else {
      delete newValues[stepId];
    }

    onChange({ values: newValues });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="flex-1">
          <RichText content={prompt} />
          {wordLimit && (
            <p className="text-sm text-gray-500 mt-1 italic">{wordLimit}</p>
          )}
        </div>
      </div>

      <div className="ml-[52px] space-y-3">
        {steps.map((step, idx) => {
          const stepId = step.id || `step-${idx}`;
          const stepText = step.text || "";
          const isBlank = stepText.includes("___");
          const stepValue = currentValues[stepId] || "";

          return (
            <div
              key={stepId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="font-medium text-gray-600 min-w-[30px]">
                {idx + 1}
              </span>
              {isBlank ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-gray-700">
                    {stepText.split("___")[0]}
                  </span>
                  <input
                    type="text"
                    value={stepValue}
                    onChange={(e) => handleStepChange(stepId, e.target.value)}
                    disabled={disabled}
                    placeholder={intl.formatMessage({ id: "Answer" })}
                    className="flex-1 px-3 py-2 border-b-2 border-main focus:outline-none focus:border-main/80"
                  />
                  <span className="text-gray-700">
                    {stepText.split("___")[1]}
                  </span>
                </div>
              ) : (
                <span className="text-gray-700 flex-1">{stepText}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * MAP_LABELLING: Map with text inputs for labels
 */
function MapLabellingRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const mapImageUrl = content?.map_image_url || "";
  const regions = content?.regions || [];
  const instructions = content?.instructions || "";

  const currentLabels = value?.labels || {};

  const handleLabelChange = (regionId, labelValue) => {
    if (disabled) return;

    const newLabels = { ...currentLabels };
    if (labelValue) {
      newLabels[regionId] = labelValue;
    } else {
      delete newLabels[regionId];
    }

    onChange({ labels: newLabels });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <div className="flex-1">
          <RichText content={prompt} />
          {instructions && (
            <div className="text-sm text-gray-500 mt-1 italic">
              <RichText content={instructions} />
            </div>
          )}
        </div>
      </div>

      {mapImageUrl && (
        <div className="ml-[52px] mb-4">
          <img
            src={mapImageUrl}
            alt="Map"
            className="w-full max-w-2xl border border-gray-300 rounded-lg"
          />
        </div>
      )}

      <div className="ml-[52px] space-y-3">
        {regions.map((region) => {
          const regionId = region.id || String(region);
          const regionLabel = region.label || region.text || regionId;
          const labelValue = currentLabels[regionId] || "";

          return (
            <div
              key={regionId}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-700 min-w-[150px]">
                <RichText content={regionLabel} />
              </span>
              <input
                type="text"
                value={labelValue}
                onChange={(e) => handleLabelChange(regionId, e.target.value)}
                disabled={disabled}
                placeholder={intl.formatMessage({ id: "Enter label" })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-main min-w-[100px]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

