import React from "react";
import { Input, Select } from "@/components/custom/details";

/**
 * Template Renderer for Exam Questions
 *
 * Parses HTML templates from the backend and replaces special tags with React components.
 * Supports: <question-input>, <choice-group>, <matching-answer-slot>, <boolean-answer-slot>, etc.
 */

/**
 * Extract all question numbers from template
 * @param {string} template - HTML template string
 * @returns {number[]} Array of question numbers found in template
 */
export const extractQuestionNumbers = (template) => {
  if (!template || typeof template !== "string") return [];

  const numbers = new Set();
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, "text/html");

  // Extract from <question-input number='X'>
  doc.querySelectorAll("question-input").forEach((el) => {
    const num = el.getAttribute("number");
    if (num) numbers.add(parseInt(num));
  });

  // Extract from <choice-group number='X'>
  doc.querySelectorAll("choice-group").forEach((el) => {
    const num = el.getAttribute("number");
    if (num) numbers.add(parseInt(num));
  });

  // Extract from <matching-answer-slot number='X'>
  doc.querySelectorAll("matching-answer-slot").forEach((el) => {
    const num = el.getAttribute("number");
    if (num) numbers.add(parseInt(num));
  });

  // Extract from <boolean-answer-slot number='X'>
  doc.querySelectorAll("boolean-answer-slot").forEach((el) => {
    const num = el.getAttribute("number");
    if (num) numbers.add(parseInt(num));
  });

  // Extract from <diagram-marker number='X'>
  doc.querySelectorAll("diagram-marker").forEach((el) => {
    const num = el.getAttribute("number");
    if (num) numbers.add(parseInt(num));
  });

  return Array.from(numbers).sort((a, b) => a - b);
};

/**
 * Render HTML template with React components
 * @param {string} template - HTML template string
 * @param {Object} answers - Current answers object {questionNumber: answer}
 * @param {Function} onAnswerChange - Callback (questionNumber, value) => void
 * @returns {React.Element} Rendered template with input components
 */
export const renderTemplate = (template, answers = {}, onAnswerChange) => {
  if (!template || typeof template !== "string") {
    return (
      <p className="text-gray-400 italic text-sm">
        No template provided for this question group
      </p>
    );
  }

  if (!onAnswerChange || typeof onAnswerChange !== "function") {
    console.error("renderTemplate: onAnswerChange callback is required");
    return (
      <p className="text-red-600 text-sm">
        Configuration error: Answer handler is missing
      </p>
    );
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, "text/html");

    // Process the template and replace special elements
    processQuestionInputs(doc, answers, onAnswerChange);
    processChoiceGroups(doc, answers, onAnswerChange);
    processMatchingSlots(doc, answers, onAnswerChange);
    processBooleanSlots(doc, answers, onAnswerChange);
    processDiagramMarkers(doc, answers, onAnswerChange);

    // Convert processed HTML to React elements
    return convertToReact(doc.body, answers, onAnswerChange);
  } catch (error) {
    console.error("Template rendering error:", error);
    return (
      <div className="text-red-600 text-sm border border-red-200 bg-red-50 p-3 rounded-lg">
        <p className="font-semibold mb-1">Unable to render question template</p>
        <p className="text-xs text-red-500">{error.message}</p>
      </div>
    );
  }
};

/**
 * Process <question-input> tags and replace with placeholder spans
 */
const processQuestionInputs = (doc, answers, onAnswerChange) => {
  doc.querySelectorAll("question-input").forEach((input) => {
    const number = input.getAttribute("number");
    const placeholder = doc.createElement("span");
    placeholder.className = "inline-input-placeholder";
    placeholder.setAttribute("data-type", "question-input");
    placeholder.setAttribute("data-number", number);
    input.replaceWith(placeholder);
  });
};

/**
 * Process <choice-group> tags (MCQ/Multiple Choice)
 */
const processChoiceGroups = (doc, answers, onAnswerChange) => {
  doc.querySelectorAll("choice-group").forEach((group) => {
    const number = group.getAttribute("number");
    const title = group.getAttribute("title") || "";
    const type = group.getAttribute("type") || "single"; // single or multiple
    const answer = group.getAttribute("answer") || "";

    try {
      // Parse options from JSON content
      const optionsText = group.textContent.trim();
      const options = JSON.parse(optionsText);

      const container = doc.createElement("div");
      container.className = "choice-group-placeholder";
      container.setAttribute("data-type", "choice-group");
      container.setAttribute("data-number", number);
      container.setAttribute("data-title", title);
      container.setAttribute("data-choice-type", type);
      container.setAttribute("data-options", JSON.stringify(options));

      group.replaceWith(container);
    } catch (error) {
      console.error("Error parsing choice group:", error);
      group.replaceWith(doc.createTextNode(`[MCQ ${number}]`));
    }
  });
};

/**
 * Process <matching-answer-slot> tags
 */
const processMatchingSlots = (doc, answers, onAnswerChange) => {
  doc.querySelectorAll("matching-answer-slot").forEach((slot) => {
    const number = slot.getAttribute("number");
    const placeholder = doc.createElement("span");
    placeholder.className = "inline-input-placeholder";
    placeholder.setAttribute("data-type", "matching-slot");
    placeholder.setAttribute("data-number", number);
    slot.replaceWith(placeholder);
  });
};

/**
 * Process <boolean-answer-slot> tags (TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN)
 */
const processBooleanSlots = (doc, answers, onAnswerChange) => {
  doc.querySelectorAll("boolean-answer-slot").forEach((slot) => {
    const number = slot.getAttribute("number");
    const slotType = slot.getAttribute("type") || "tfng"; // tfng or ynng
    const placeholder = doc.createElement("span");
    placeholder.className = "inline-input-placeholder";
    placeholder.setAttribute("data-type", "boolean-slot");
    placeholder.setAttribute("data-number", number);
    placeholder.setAttribute("data-slot-type", slotType);
    slot.replaceWith(placeholder);
  });
};

/**
 * Process <diagram-marker> tags
 */
const processDiagramMarkers = (doc, answers, onAnswerChange) => {
  doc.querySelectorAll("diagram-marker").forEach((marker) => {
    const number = marker.getAttribute("number");
    const x = marker.style.left || "0%";
    const y = marker.style.top || "0%";

    const placeholder = doc.createElement("div");
    placeholder.className = "diagram-marker-placeholder";
    placeholder.setAttribute("data-type", "diagram-marker");
    placeholder.setAttribute("data-number", number);
    placeholder.setAttribute("data-x", x);
    placeholder.setAttribute("data-y", y);
    placeholder.style.position = "absolute";
    placeholder.style.left = x;
    placeholder.style.top = y;

    marker.replaceWith(placeholder);
  });
};

/**
 * Convert DOM node to React elements
 */
const convertToReact = (node, answers = {}, onAnswerChange, key = 0) => {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  // Element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Handle placeholders - replace with React components
    if (node.classList.contains("inline-input-placeholder")) {
      const dataType = node.getAttribute("data-type");
      const number = parseInt(node.getAttribute("data-number"));

      if (dataType === "question-input") {
        return (
          <span
            key={`input-${number}`}
            className="inline-block mx-2 align-middle min-w-[150px]"
          >
            <Input
              type="text"
              placeholder={`Answer ${number}`}
              name={`question-${number}`}
              register={() => ({
                value: answers[number] || "",
                onChange: (e) => onAnswerChange(number, e.target.value),
              })}
            />
          </span>
        );
      }

      if (dataType === "matching-slot" || dataType === "boolean-slot") {
        const slotType = node.getAttribute("data-slot-type");
        let options = [];

        if (dataType === "boolean-slot") {
          options =
            slotType === "ynng"
              ? [
                  { value: "YES", label: "YES" },
                  { value: "NO", label: "NO" },
                  { value: "NOT GIVEN", label: "NOT GIVEN" },
                ]
              : [
                  { value: "TRUE", label: "TRUE" },
                  { value: "FALSE", label: "FALSE" },
                  { value: "NOT GIVEN", label: "NOT GIVEN" },
                ];
        } else {
          // For matching-slot, options should come from common_options or group data
          // We'll use placeholder options for now
          options = ["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => ({
            value: letter,
            label: letter,
          }));
        }

        return (
          <span
            key={`select-${number}`}
            className="inline-block mx-2 align-middle min-w-[120px]"
          >
            <Select
              placeholder={`${number}`}
              options={options}
              value={answers[number] || ""}
              onChange={(value) => onAnswerChange(number, value)}
            />
          </span>
        );
      }
    }

    // Handle choice-group placeholders
    if (node.classList.contains("choice-group-placeholder")) {
      const number = parseInt(node.getAttribute("data-number"));
      const title = node.getAttribute("data-title");
      const choiceType = node.getAttribute("data-choice-type");
      const optionsStr = node.getAttribute("data-options");

      try {
        const options = JSON.parse(optionsStr);
        const selectOptions = options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...
          const displayText =
            typeof option === "string"
              ? option
              : option.text || option.label || option;

          return {
            value: letter,
            label: `${letter}) ${displayText}`,
          };
        });

        return (
          <div
            key={`choice-${number}`}
            className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {title && (
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {title}
              </p>
            )}
            <Select
              placeholder={`Question ${number}`}
              options={selectOptions}
              value={answers[number] || ""}
              onChange={(value) => onAnswerChange(number, value)}
            />
          </div>
        );
      } catch (error) {
        console.error("Error rendering choice group:", error);
        return <div key={`choice-error-${number}`}>Choice Group {number}</div>;
      }
    }

    // Handle diagram markers
    if (node.classList.contains("diagram-marker-placeholder")) {
      const number = parseInt(node.getAttribute("data-number"));
      const x = node.getAttribute("data-x");
      const y = node.getAttribute("data-y");

      return (
        <div
          key={`marker-${number}`}
          className="absolute bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
          style={{ left: x, top: y }}
        >
          {number}
        </div>
      );
    }

    // Regular HTML elements
    const tagName = node.tagName.toLowerCase();
    const props = {
      key: `${tagName}-${key}`,
    };

    // Copy attributes
    Array.from(node.attributes).forEach((attr) => {
      if (attr.name === "class") {
        props.className = attr.value;
      } else if (attr.name === "style") {
        // Parse inline styles
        const styles = {};
        attr.value.split(";").forEach((style) => {
          const [property, value] = style.split(":");
          if (property && value) {
            const camelCaseProperty = property
              .trim()
              .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            styles[camelCaseProperty] = value.trim();
          }
        });
        props.style = styles;
      } else {
        props[attr.name] = attr.value;
      }
    });

    // Convert children
    const children = Array.from(node.childNodes)
      .map((child, idx) => convertToReact(child, answers, onAnswerChange, idx))
      .filter(Boolean);

    return React.createElement(tagName, props, ...children);
  }

  return null;
};

/**
 * Get question numbers and their types from template
 * Useful for navigation and progress tracking
 *
 * @param {string} template - HTML template string
 * @returns {Array<{number: number, type: string}>} Array of question info
 */
export const getTemplateQuestionInfo = (template) => {
  if (!template || typeof template !== "string") return [];

  const questions = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, "text/html");

  doc.querySelectorAll("question-input").forEach((el) => {
    const num = parseInt(el.getAttribute("number"));
    if (!isNaN(num)) {
      questions.push({ number: num, type: "input" });
    }
  });

  doc.querySelectorAll("choice-group").forEach((el) => {
    const num = parseInt(el.getAttribute("number"));
    if (!isNaN(num)) {
      questions.push({ number: num, type: "choice" });
    }
  });

  doc.querySelectorAll("matching-answer-slot").forEach((el) => {
    const num = parseInt(el.getAttribute("number"));
    if (!isNaN(num)) {
      questions.push({ number: num, type: "matching" });
    }
  });

  doc.querySelectorAll("boolean-answer-slot").forEach((el) => {
    const num = parseInt(el.getAttribute("number"));
    if (!isNaN(num)) {
      questions.push({ number: num, type: "boolean" });
    }
  });

  doc.querySelectorAll("diagram-marker").forEach((el) => {
    const num = parseInt(el.getAttribute("number"));
    if (!isNaN(num)) {
      questions.push({ number: num, type: "diagram" });
    }
  });

  return questions.sort((a, b) => a.number - b.number);
};

/**
 * Validate if answers are complete for a template
 *
 * @param {string} template - HTML template string
 * @param {Object} answers - Answers object
 * @returns {{isComplete: boolean, missing: number[], answered: number, total: number}}
 */
export const validateTemplateAnswers = (template, answers = {}) => {
  const questionNumbers = extractQuestionNumbers(template);
  const missing = questionNumbers.filter((num) => !answers[num]);

  return {
    isComplete: missing.length === 0,
    missing,
    answered: questionNumbers.length - missing.length,
    total: questionNumbers.length,
  };
};
