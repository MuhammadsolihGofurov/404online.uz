import React from "react";
import { useIntl } from "react-intl";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * QuestionRendererReadOnly
 * 
 * Read-only version of QuestionRenderer for displaying submission results.
 * Shows student answers with correct/incorrect indicators.
 */
export function QuestionRendererReadOnly({ 
  question, 
  userAnswer, 
  correctAnswer, 
  showCorrectness = true 
}) {
  const intl = useIntl();
  const { question_type, prompt, content, question_number } = question;

  // Determine if answer is correct (only if we have both answers and showCorrectness is true)
  const isCorrect = showCorrectness && correctAnswer && userAnswer
    ? checkAnswerCorrectness(question_type, userAnswer, correctAnswer)
    : null;

  // Render based on question type
  switch (question_type) {
    case "MCQ_SINGLE":
      return (
        <MCQSingleReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          showCorrectness={showCorrectness}
        />
      );

    case "MCQ_MULTIPLE":
      return (
        <MCQMultipleReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          showCorrectness={showCorrectness}
        />
      );

    case "TFNG":
      return (
        <TFNGReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          showCorrectness={showCorrectness}
        />
      );

    case "SHORT_ANSWER":
      return (
        <ShortAnswerReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          showCorrectness={showCorrectness}
        />
      );

    case "SUMMARY_FILL_BLANKS":
      return (
        <SummaryFillBlanksReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
        />
      );

    case "MATCHING_DRAG_DROP":
    case "MATCHING_TABLE_CLICK":
      return (
        <MatchingReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
        />
      );

    case "TABLE_COMPLETION":
      return (
        <TableCompletionReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
        />
      );

    case "FLOWCHART_COMPLETION":
      return (
        <FlowchartCompletionReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
        />
      );

    case "MAP_LABELLING":
      return (
        <MapLabellingReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
        />
      );

    case "ESSAY":
      return (
        <EssayReadOnly
          question={question}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          showCorrectness={showCorrectness}
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
 * Helper function to check if answer is correct
 */
function checkAnswerCorrectness(questionType, userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return null;

  const userValue = userAnswer.value || userAnswer;
  const correctValue = correctAnswer.value || correctAnswer;

  switch (questionType) {
    case "MCQ_SINGLE":
    case "TFNG":
    case "SHORT_ANSWER":
      return String(userValue).trim().toUpperCase() === String(correctValue).trim().toUpperCase();

    case "MCQ_MULTIPLE":
      const userSet = new Set(Array.isArray(userValue) ? userValue.map(v => String(v).toUpperCase()) : []);
      const correctSet = new Set(Array.isArray(correctValue) ? correctValue.map(v => String(v).toUpperCase()) : []);
      return userSet.size === correctSet.size && [...userSet].every(v => correctSet.has(v));

    default:
      return null; // Complex types may require manual review
  }
}

/**
 * MCQ_SINGLE Read-Only
 */
function MCQSingleReadOnly({ question, userAnswer, correctAnswer, isCorrect, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const options = content?.options || [];

  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { key: opt, text: opt };
    } else if (opt?.key && opt?.text) {
      return opt;
    } else {
      return { key: String(idx), text: String(opt) };
    }
  });

  const userValue = userAnswer?.value || "";
  const correctValue = correctAnswer?.value || "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
        {showCorrectness && isCorrect !== null && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 ml-[52px]">
        {normalizedOptions.map((option) => {
          const isUserAnswer = userValue === option.key;
          const isCorrectAnswer = correctValue === option.key;
          const showCorrect = showCorrectness && correctAnswer;

          let borderColor = "border-gray-200";
          if (showCorrect && isCorrectAnswer) {
            borderColor = "border-green-500 border-2";
          } else if (showCorrect && isUserAnswer && !isCorrect) {
            borderColor = "border-red-500 border-2";
          } else if (isUserAnswer) {
            borderColor = "border-blue-500 border-2";
          }

          return (
            <div
              key={option.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${borderColor} bg-white`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isUserAnswer ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}>
                {isUserAnswer && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="font-medium text-gray-700">{option.key}</span>
              <span className="text-gray-600 flex-1">{option.text}</span>
              {showCorrect && isCorrectAnswer && (
                <span className="text-xs font-semibold text-green-600">
                  {intl.formatMessage({ id: "Correct Answer" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * MCQ_MULTIPLE Read-Only
 */
function MCQMultipleReadOnly({ question, userAnswer, correctAnswer, isCorrect, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const options = content?.options || [];

  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { key: opt, text: opt };
    } else if (opt?.key && opt?.text) {
      return opt;
    } else {
      return { key: String(idx), text: String(opt) };
    }
  });

  const userValues = Array.isArray(userAnswer?.value) ? userAnswer.value : [];
  const correctValues = Array.isArray(correctAnswer?.value) ? correctAnswer.value : [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
        {showCorrectness && isCorrect !== null && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 ml-[52px]">
        {normalizedOptions.map((option) => {
          const isUserSelected = userValues.includes(option.key);
          const isCorrectOption = correctValues.includes(option.key);
          const showCorrect = showCorrectness && correctAnswer;

          let borderColor = "border-gray-200";
          if (showCorrect && isCorrectOption) {
            borderColor = "border-green-500 border-2";
          } else if (showCorrect && isUserSelected && !isCorrectOption) {
            borderColor = "border-red-500 border-2";
          } else if (isUserSelected) {
            borderColor = "border-blue-500 border-2";
          }

          return (
            <div
              key={option.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${borderColor} bg-white`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isUserSelected ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}>
                {isUserSelected && <div className="w-2 h-2 rounded bg-blue-500" />}
              </div>
              <span className="font-medium text-gray-700">{option.key}</span>
              <span className="text-gray-600 flex-1">{option.text}</span>
              {showCorrect && isCorrectOption && (
                <span className="text-xs font-semibold text-green-600">
                  {intl.formatMessage({ id: "Correct" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TFNG Read-Only
 */
function TFNGReadOnly({ question, userAnswer, correctAnswer, isCorrect, showCorrectness }) {
  const intl = useIntl();
  const { prompt, question_number } = question;

  const options = [
    { key: "TRUE", label: "True" },
    { key: "FALSE", label: "False" },
    { key: "NOT GIVEN", label: "Not Given" },
  ];

  const userValue = userAnswer?.value || "";
  const correctValue = correctAnswer?.value || "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
        {showCorrectness && isCorrect !== null && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 ml-[52px]">
        {options.map((option) => {
          const isUserAnswer = userValue.toUpperCase() === option.key.toUpperCase();
          const isCorrectAnswer = correctValue.toUpperCase() === option.key.toUpperCase();
          const showCorrect = showCorrectness && correctAnswer;

          let borderColor = "border-gray-200";
          if (showCorrect && isCorrectAnswer) {
            borderColor = "border-green-500 border-2";
          } else if (showCorrect && isUserAnswer && !isCorrect) {
            borderColor = "border-red-500 border-2";
          } else if (isUserAnswer) {
            borderColor = "border-blue-500 border-2";
          }

          return (
            <div
              key={option.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${borderColor} bg-white`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isUserAnswer ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}>
                {isUserAnswer && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="font-medium text-gray-700">{option.label}</span>
              {showCorrect && isCorrectAnswer && (
                <span className="text-xs font-semibold text-green-600 ml-2">
                  {intl.formatMessage({ id: "Correct" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SHORT_ANSWER Read-Only
 */
function ShortAnswerReadOnly({ question, userAnswer, correctAnswer, isCorrect, showCorrectness }) {
  const intl = useIntl();
  const { prompt, question_number } = question;

  const userValue = userAnswer?.value || "";
  const correctValue = correctAnswer?.value || "";

  let borderColor = "border-gray-200";
  if (showCorrectness && isCorrect === true) {
    borderColor = "border-green-500 border-2";
  } else if (showCorrectness && isCorrect === false) {
    borderColor = "border-red-500 border-2";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
        {showCorrectness && isCorrect !== null && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
          </div>
        )}
      </div>

      <div className="ml-[52px] space-y-2">
        <div className={`px-4 py-3 rounded-lg border-2 ${borderColor} bg-white`}>
          <p className="text-sm text-gray-500 mb-1">
            {intl.formatMessage({ id: "Your Answer" })}:
          </p>
          <p className="text-gray-900 font-medium">{userValue || intl.formatMessage({ id: "No answer provided" })}</p>
        </div>
        {showCorrectness && correctAnswer && (
          <div className="px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50">
            <p className="text-sm text-green-700 mb-1">
              {intl.formatMessage({ id: "Correct Answer" })}:
            </p>
            <p className="text-green-900 font-medium">{correctValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SUMMARY_FILL_BLANKS Read-Only
 */
function SummaryFillBlanksReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const items = content?.items || [];
  const text = content?.text || "";
  
  // Legacy support: if items array doesn't exist, fall back to text-based rendering
  const hasLegacyFormat = !items.length && text;
  
  const userBlanks = userAnswer?.blanks || userAnswer?.values || {};
  const correctBlanks = correctAnswer?.blanks || correctAnswer?.values || {};

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
            {item.text}
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
            {item.text}
          </h4>
        );
      } else if (item.type === "question") {
        const userValue = userBlanks[item.id] || "";
        const correctValue = showCorrectness ? (correctBlanks[item.id] || "") : null;
        const isCorrect = showCorrectness && correctValue && 
          userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();

        const questionRow = (
          <span className="inline-flex items-center gap-1 flex-wrap">
            {item.pre && <span>{item.pre}</span>}
            <span className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 text-center font-medium ${
              isCorrect === true ? "border-green-500 bg-green-50" :
              isCorrect === false ? "border-red-500 bg-red-50" :
              "border-blue-500 bg-blue-50"
            }`}>
              {userValue || "___"}
            </span>
            {showCorrectness && correctValue && (
              <span className="text-xs text-green-600 ml-1">
                ({intl.formatMessage({ id: "Correct" })}: {correctValue})
              </span>
            )}
            {item.post && <span>{item.post}</span>}
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

  // Legacy format: Render text with placeholders
  const renderLegacyText = () => {
    if (!hasLegacyFormat) return null;

    const blankMatches = text.match(/___\(([^)]+)\)___/g) || [];
    const blankIds = blankMatches.map((match) =>
      match.replace(/___\(([^)]+)\)___/, "$1")
    );

    let parts = text.split(/(___\([^)]+\)___)/);
    return parts.map((part, idx) => {
      const blankMatch = part.match(/___\(([^)]+)\)___/);
      if (blankMatch) {
        const blankId = blankMatch[1];
        const blankIndex = blankIds.indexOf(blankId);
        const userValue = userBlanks[blankIndex] || userBlanks[blankId] || "";
        const correctValue = showCorrectness && correctBlanks ? (correctBlanks[blankIndex] || correctBlanks[blankId] || "") : null;
        const isCorrect = showCorrectness && correctValue && userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();

        return (
          <span key={idx} className="inline-block">
            <span className={`inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 ${
              isCorrect === true ? "border-green-500 bg-green-50" :
              isCorrect === false ? "border-red-500 bg-red-50" :
              "border-blue-500 bg-blue-50"
            } text-center font-medium`}>
              {userValue || "___"}
            </span>
            {showCorrectness && correctValue && (
              <span className="text-xs text-green-600 ml-1">
                ({intl.formatMessage({ id: "Correct" })}: {correctValue})
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
        <p className="text-gray-900 flex-1">{prompt}</p>
      </div>

      <div className="ml-[52px] p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-800 leading-relaxed">
          {items.length > 0 ? renderStructuredItems() : renderLegacyText()}
        </div>
      </div>
    </div>
  );
}

/**
 * MATCHING Read-Only
 */
function MatchingReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const listA = content?.list_a || [];
  const listB = content?.list_b || [];

  const userMatches = userAnswer?.matches || userAnswer?.pairs || [];
  const correctMatches = correctAnswer?.pairs || [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
      </div>

      <div className="ml-[52px] space-y-3">
        {listA.map((itemA) => {
          const itemAId = itemA.id || itemA.key || String(itemA);
          const itemAText = itemA.text || itemA.label || String(itemA);
          const userMatch = userMatches.find((m) => m.from === itemAId);
          const correctMatch = showCorrectness ? correctMatches.find((m) => m.from === itemAId) : null;
          const isCorrect = showCorrectness && userMatch && correctMatch && userMatch.to === correctMatch.to;

          const matchedItemB = listB.find((b) => (b.id || b.key || String(b)) === userMatch?.to);

          return (
            <div
              key={itemAId}
              className={`p-3 rounded-lg border-2 ${
                isCorrect === true ? "border-green-500 bg-green-50" :
                isCorrect === false ? "border-red-500 bg-red-50" :
                "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700 min-w-[100px]">
                  {itemAId}
                </span>
                <span className="text-gray-800 flex-1">{itemAText}</span>
                <span className="px-3 py-1 bg-white rounded border border-gray-300 min-w-[150px]">
                  {matchedItemB ? `${matchedItemB.id || matchedItemB.key}: ${matchedItemB.text || matchedItemB.label}` : intl.formatMessage({ id: "No match" })}
                </span>
                {showCorrectness && correctMatch && (
                  <span className="text-xs text-green-600">
                    ({intl.formatMessage({ id: "Correct" })}: {listB.find((b) => (b.id || b.key || String(b)) === correctMatch.to)?.id || correctMatch.to})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TABLE_COMPLETION Read-Only
 */
function TableCompletionReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const columns = content?.columns || [];
  const rows = content?.rows || [];

  const userValues = userAnswer?.values || {};
  const correctValues = showCorrectness ? (correctAnswer?.values || {}) : {};

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
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
                    const userValue = userValues[cellKey] || "";
                    const correctValue = correctValues[cellKey];
                    const isCorrect = showCorrectness && correctValue && userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();

                    return (
                      <td
                        key={colIdx}
                        className={`border border-gray-300 px-4 py-2 ${
                          isBlank && isCorrect === true ? "bg-green-50" :
                          isBlank && isCorrect === false ? "bg-red-50" :
                          ""
                        }`}
                      >
                        {isBlank ? (
                          <div>
                            <p className={`font-medium ${
                              isCorrect === true ? "text-green-700" :
                              isCorrect === false ? "text-red-700" :
                              "text-blue-700"
                            }`}>
                              {userValue || "___"}
                            </p>
                            {showCorrectness && correctValue && (
                              <p className="text-xs text-green-600 mt-1">
                                {intl.formatMessage({ id: "Correct" })}: {correctValue}
                              </p>
                            )}
                          </div>
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
 * FLOWCHART_COMPLETION Read-Only
 */
function FlowchartCompletionReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const steps = content?.steps || [];

  const userValues = userAnswer?.values || {};
  const correctValues = showCorrectness ? (correctAnswer?.values || {}) : {};

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
      </div>

      <div className="ml-[52px] space-y-3">
        {steps.map((step, idx) => {
          const stepId = step.id || `step-${idx}`;
          const stepText = step.text || "";
          const isBlank = stepText.includes("___");
          const userValue = userValues[stepId] || "";
          const correctValue = correctValues[stepId];
          const isCorrect = showCorrectness && correctValue && userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();

          return (
            <div
              key={stepId}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                isBlank && isCorrect === true ? "border-green-500 bg-green-50" :
                isBlank && isCorrect === false ? "border-red-500 bg-red-50" :
                "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="font-medium text-gray-600 min-w-[30px]">
                {idx + 1}
              </span>
              {isBlank ? (
                <div className="flex-1">
                  <p className="text-gray-700">
                    {stepText.split("___")[0]}
                    <span className={`font-medium mx-1 ${
                      isCorrect === true ? "text-green-700" :
                      isCorrect === false ? "text-red-700" :
                      "text-blue-700"
                    }`}>
                      {userValue || "___"}
                    </span>
                    {stepText.split("___")[1]}
                  </p>
                  {showCorrectness && correctValue && (
                    <p className="text-xs text-green-600 mt-1">
                      {intl.formatMessage({ id: "Correct" })}: {correctValue}
                    </p>
                  )}
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
 * MAP_LABELLING Read-Only
 */
function MapLabellingReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const intl = useIntl();
  const { prompt, content, question_number } = question;
  const mapImageUrl = content?.map_image_url || "";
  const regions = content?.regions || [];

  const userLabels = userAnswer?.labels || {};
  const correctLabels = showCorrectness ? (correctAnswer?.labels || {}) : {};

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="text-gray-900 flex-1">{prompt}</p>
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
          const userValue = userLabels[regionId] || "";
          const correctValue = correctLabels[regionId];
          const isCorrect = showCorrectness && correctValue && userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();

          return (
            <div
              key={regionId}
              className={`flex items-center gap-4 p-3 rounded-lg border-2 ${
                isCorrect === true ? "border-green-500 bg-green-50" :
                isCorrect === false ? "border-red-500 bg-red-50" :
                "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="font-medium text-gray-700 min-w-[150px]">
                {regionLabel}
              </span>
              <span className={`px-3 py-2 border rounded-lg font-medium ${
                isCorrect === true ? "border-green-500 text-green-700 bg-white" :
                isCorrect === false ? "border-red-500 text-red-700 bg-white" :
                "border-blue-500 text-blue-700 bg-white"
              } min-w-[100px]`}>
                {userValue || "___"}
              </span>
              {showCorrectness && correctValue && (
                <span className="text-xs text-green-600">
                  ({intl.formatMessage({ id: "Correct" })}: {correctValue})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EssayReadOnly({ question, userAnswer, correctAnswer, showCorrectness }) {
  const { question_number, prompt, content } = question;
  const minWords = Number(content?.min_word_count) || null;
  const text = userAnswer?.text || "";
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const meetsMin = !minWords || wordCount >= minWords;
  const modelAnswer = correctAnswer?.text;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-700 min-w-[40px]">
          Q{question_number}
        </span>
        <p className="flex-1 text-gray-900">{prompt}</p>
        {showCorrectness && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700">
            Manual review required
          </span>
        )}
      </div>
      <div className="ml-[52px] space-y-3">
        <div className="text-sm font-semibold text-slate-700">
          Student response
        </div>
        <div className="p-4 bg-white border rounded-2xl border-slate-200 text-slate-700 whitespace-pre-wrap min-h-[150px]">
          {text || "No response submitted."}
        </div>
        <div
          className={`text-sm font-semibold ${
            meetsMin ? "text-emerald-600" : "text-red-600"
          }`}
        >
          Words: {wordCount}
          {minWords ? ` / Min: ${minWords}` : ""}
        </div>
        {modelAnswer && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              Model answer
            </p>
            <div
              className="p-4 text-sm text-slate-700 bg-slate-50 border border-dashed rounded-2xl border-slate-300"
              dangerouslySetInnerHTML={{ __html: modelAnswer }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

