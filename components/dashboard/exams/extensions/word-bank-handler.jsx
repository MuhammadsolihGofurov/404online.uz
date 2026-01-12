import React, { useEffect } from "react";

/**
 * WordBankHandler Component
 *
 * Manages drag-and-drop functionality for Summary Completion questions:
 * 1. Wraps individual drag items (.node-dragItem) in a styled container
 * 2. Adds "AVAILABLE WORDS" label to the container
 * 3. Handles drag events for word-bank items and matching options
 * 4. Processes matching options boxes into draggable items
 *
 * This component runs side effects only - renders nothing.
 */

const WORD_BANK_STYLES = {
  container: `
    margin-top: 24px;
    padding: 52px 20px 20px 20px;
    background: linear-gradient(135deg, rgb(239 246 255) 0%, rgb(248 250 252) 100%);
    border-top: 2px solid #cbd5e1;
    border-radius: 0 0 12px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    position: relative;
  `,
  label: `
    position: absolute;
    top: 20px;
    left: 20px;
    font-size: 10px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    line-height: 1;
    z-index: 10;
    pointer-events: none;
  `,
};

const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const mergeRomanFragments = (lines) => {
  const merged = [];
  let romanBuffer = "";
  const romanOnly = /^[ivxlcdm]+$/i;
  const romanWithDot = /^([ivxlcdm]+)\s*\.\s*(.*)$/i;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (romanOnly.test(trimmed)) {
      romanBuffer += trimmed;
      return;
    }

    if (romanBuffer) {
      const match = trimmed.match(romanWithDot);
      if (match) {
        const combinedMarker = `${romanBuffer}${match[1]}`;
        const rest = match[2]?.trim();
        merged.push(rest ? `${combinedMarker}. ${rest}` : `${combinedMarker}.`);
        romanBuffer = "";
        return;
      }

      merged.push(`${romanBuffer}. ${trimmed}`.trim());
      romanBuffer = "";
      return;
    }

    merged.push(trimmed);
  });

  return merged;
};

const splitMatchingOptions = (raw) => {
  const normalized = raw.replace(/\r/g, "\n");
  let lines = normalized
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    lines = normalized
      .split(/(?=\s*(?:\d+|[ivxlcdm]+|[A-Z])\s*\.)/i)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  return mergeRomanFragments(lines);
};

export const WordBankHandler = () => {
  useEffect(() => {
    const wrapDragItems = () => {
      const editor = document.querySelector(".tiptap-question-renderer");
      if (!editor) return;

      const dragItems = editor.querySelectorAll(".node-dragItem");
      if (dragItems.length === 0) return;

      // Prevent duplicate wrapping
      if (dragItems[0].parentElement?.classList.contains("word-bank-container"))
        return;

      // Create container
      const container = document.createElement("div");
      container.className = "word-bank-container";
      container.style.cssText =
        WORD_BANK_STYLES.container + " width: 100%; box-sizing: border-box;";

      // Add label
      const label = document.createElement("div");
      label.className = "word-bank-label";
      label.innerHTML =
        '<span style="color: #3b82f6; font-size: 14px;">●</span> AVAILABLE WORDS';
      label.style.cssText = WORD_BANK_STYLES.label;
      container.appendChild(label);

      // Insert container and move drag items into it
      const firstDragItem = dragItems[0];
      firstDragItem.parentNode.insertBefore(container, firstDragItem);

      dragItems.forEach((item) => {
        container.appendChild(item);
        item.style.cssText = "display: inline-block; margin: 0;";
      });
    };

    const wrapTimer = setTimeout(wrapDragItems, 0);

    // Add global drag styles
    const styleSheet = document.createElement("style");
    styleSheet.id = "word-bank-styles";
    styleSheet.textContent = `
      .node-dragItem {
        display: inline-block !important;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
      }
      
      .node-dragItem button,
      .drag-item,
      .matching-option-item {
        cursor: grab !important;
        user-select: none !important;
        transition: all 0.2s ease !important;
      }
      
      .node-dragItem button:active,
      .drag-item:active,
      .matching-option-item:active {
        cursor: grabbing !important;
        transform: scale(0.95) !important;
      }

      /* Preserve newlines inside matching options boxes when left as plain text */
      .matching-container .matching-options-box {
        white-space: pre-line;
      }
    `;
    document.head.appendChild(styleSheet);

    // Drag event handlers
    const handleDragStart = (e) => {
      const button = e.target.closest(".node-dragItem button");
      if (button) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", button.textContent.trim());
        button.style.opacity = "0.6";
        return;
      }

      if (e.target.classList.contains("drag-item")) {
        const word =
          e.target.getAttribute("data-word") || e.target.textContent.trim();
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", word);
        e.target.style.opacity = "0.6";
        return;
      }

      if (e.target.classList.contains("matching-option-item")) {
        if (e.target.getAttribute("data-drag-disabled") === "true") {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", e.target.textContent.trim());
        e.target.style.opacity = "0.6";
      }
    };

    const handleDragEnd = (e) => {
      const button = e.target.closest(".node-dragItem button");
      if (button) {
        button.style.opacity = "1";
      } else {
        e.target.style.opacity = "1";
      }
    };

    // Process matching options boxes
    const processMatchingOptionsBox = () => {
      const optionBoxes = document.querySelectorAll(
        ".matching-options-box:not([data-drag-processed])"
      );

      optionBoxes.forEach((box) => {
        const text = box.textContent?.trim();
        if (!text) return;

        // If inside a matching container, render static lines (no chips, no drag)
        const container = box.closest(".matching-container");
        if (container) {
          const raw = text || "";
          const lines = splitMatchingOptions(raw);

          if (lines.length === 0) {
            box.setAttribute("data-drag-processed", "true");
            return;
          }

          // Render as plain text with <br> between lines
          box.innerHTML = lines.map((l) => escapeHtml(l)).join("<br />");
          Object.assign(box.style, {
            display: "block",
            whiteSpace: "normal",
          });

          box.setAttribute("data-drag-processed", "true");
          return;
        }

        const options = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (options.length === 0) return;

        box.innerHTML = "";
        Object.assign(box.style, {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        });

        options.forEach((option) => {
          const item = document.createElement("div");
          item.className = "matching-option-item";
          item.draggable = true;
          item.textContent = option;
          Object.assign(item.style, {
            padding: "10px 16px",
            borderRadius: "6px",
            background:
              "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
            color: "white",
            fontWeight: "600",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          });
          box.appendChild(item);
        });

        box.setAttribute("data-drag-processed", "true");
      });
    };

    const matchingTimer = setTimeout(processMatchingOptionsBox, 300);

    // Observe DOM changes to ensure wrapping occurs even after async renders
    const wrapObserver = new MutationObserver(() => {
      wrapDragItems();
    });

    wrapObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Event listeners
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("dragend", handleDragEnd, true);

    // Watch for DOM mutations
    const observer = new MutationObserver(() => {
      setTimeout(processMatchingOptionsBox, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      clearTimeout(wrapTimer);
      clearTimeout(matchingTimer);
      styleSheet.remove();
      wrapObserver.disconnect();
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("dragend", handleDragEnd, true);
      observer.disconnect();
    };
  }, []);

  return null;
};
