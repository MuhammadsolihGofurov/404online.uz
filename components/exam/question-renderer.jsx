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
 */
function MCQSingleRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const options = content?.options || [];

  // Normalize options (handle both string arrays and object arrays)
  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { key: opt, text: opt };
    } else if (opt?.key && opt?.text) {
      return opt;
    } else {
      // Fallback: use index as key
      return { key: String(idx), text: String(opt) };
    }
  });

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
              value={option.key}
              checked={currentValue === option.key}
              onChange={(e) => {
                if (!disabled) {
                  onChange({ value: e.target.value });
                }
              }}
              disabled={disabled}
              className="w-5 h-5 text-main focus:ring-main cursor-pointer"
            />
            <span className="font-medium text-gray-700">{option.key}</span>
            <span className="text-gray-600 flex-1">{option.text}</span>
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

  // Normalize options
  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { key: opt, text: opt };
    } else if (opt?.key && opt?.text) {
      return opt;
    } else {
      return { key: String(idx), text: String(opt) };
    }
  });

  const currentValues = Array.isArray(value?.value) ? value.value : [];

  const handleToggle = (optionKey) => {
    if (disabled) return;

    let newValues;
    if (currentValues.includes(optionKey)) {
      // Remove if already selected
      newValues = currentValues.filter((v) => v !== optionKey);
    } else {
      // Add if not selected (check max_choices limit)
      if (maxChoices && currentValues.length >= maxChoices) {
        return; // Don't add if max reached
      }
      newValues = [...currentValues, optionKey];
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
          const isSelected = currentValues.includes(option.key);
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
                onChange={() => handleToggle(option.key)}
                disabled={isDisabled}
                className="w-5 h-5 text-main focus:ring-main rounded cursor-pointer"
              />
              <span className="font-medium text-gray-700">{option.key}</span>
              <span className="text-gray-600 flex-1">{option.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TFNG: True/False/Not Given - Radio buttons
 */
function TFNGRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, question_number } = question;

  const options = [
    { key: "TRUE", label: "True" },
    { key: "FALSE", label: "False" },
    { key: "NOT GIVEN", label: "Not Given" },
  ];

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
  const text = content?.text || "";
  const blanks = content?.blanks || [];
  const wordLimit = content?.word_limit || null;

  // Extract blank IDs from text (e.g., ___(1)___, ___(A)___)
  const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
  const blankIds = blankMatches.map((match) =>
    match.replace(/___\(([^)]+)\)___/, "$1")
  );

  const currentBlanks = value?.blanks || [];

  const handleBlankChange = (blankId, blankValue) => {
    if (disabled) return;

    const newBlanks = [...currentBlanks];
    const index = blankIds.indexOf(blankId);
    if (index >= 0) {
      newBlanks[index] = blankValue;
    } else {
      newBlanks.push(blankValue);
    }

    onChange({ blanks: newBlanks });
  };

  // Render text with input fields for blanks
  const renderTextWithBlanks = () => {
    let parts = text.split(/(___\([^)]+\)___)/);
    return parts.map((part, idx) => {
      const blankMatch = part.match(/___\(([^)]+)\)___/);
      if (blankMatch) {
        const blankId = blankMatch[1];
        const blankIndex = blankIds.indexOf(blankId);
        const blankValue = currentBlanks[blankIndex] || "";

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
  
  // Calculate available words (words not currently used in blanks)
  const usedWords = Object.values(currentBlanks).filter(Boolean);
  const availableWords = wordBank.filter((word) => !usedWords.includes(word));

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
              {availableWords.map((word, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    // Find first empty blank
                    const emptyBlank = blankIds.find(
                      (id) => !currentBlanks[id]
                    );
                    if (emptyBlank) {
                      handleBlankSelect(emptyBlank, word);
                    }
                  }}
                  disabled={disabled || !blankIds.some((id) => !currentBlanks[id])}
                  className={`px-3 py-1 rounded-lg border-2 transition-colors ${
                    disabled || !blankIds.some((id) => !currentBlanks[id])
                      ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100"
                      : "border-blue-300 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer"
                  }`}
                >
                  {word}
                </button>
              ))}
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
 */
function MatchingRenderer({ question, value, onChange, disabled }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const listA = content?.list_a || [];
  const listB = content?.list_b || [];

  const currentMatches = value?.matches || value?.pairs || [];

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

      <div className="ml-[52px] space-y-3">
        {listA.map((itemA) => {
          const itemAId = itemA.id || itemA.key || String(itemA);
          const itemAText = itemA.text || itemA.label || String(itemA);
          const currentMatch = currentMatches.find((m) => m.from === itemAId);

          return (
            <div
              key={itemAId}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-700 min-w-[100px]">
                {itemAId}
              </span>
              <span className="text-gray-800 flex-1">{itemAText}</span>
              <select
                value={currentMatch?.to || ""}
                onChange={(e) => handleMatch(itemAId, e.target.value)}
                disabled={disabled}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-main min-w-[150px]"
              >
                <option value="">
                  {intl.formatMessage({ id: "Select match" })}
                </option>
                {listB.map((itemB) => {
                  const itemBId = itemB.id || itemB.key || String(itemB);
                  const itemBText = itemB.text || itemB.label || String(itemB);
                  return (
                    <option key={itemBId} value={itemBId}>
                      {itemBId}: {itemBText}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
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
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-gray-700 text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = row.id || String(row);
              const cells = row.cells || [];

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
                {regionLabel}
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

