import React, { useEffect } from "react";

export const WordBankHandler = () => {
  useEffect(() => {
    // Add global styles for word-bank drag items
    const styleSheet = document.createElement("style");
    styleSheet.id = "word-bank-styles";
    styleSheet.textContent = `
      .drag-item {
        cursor: grab !important;
        padding: 8px 12px !important;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: white !important;
        border-radius: 6px !important;
        font-weight: bold !important;
        user-select: none !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        display: inline-block !important;
        border: none !important;
        margin: 2px !important;
      }
      
      .drag-item:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
      }
      
      .drag-item:active {
        cursor: grabbing !important;
        opacity: 0.5 !important;
      }
    `;

    if (!document.getElementById("word-bank-styles")) {
      document.head.appendChild(styleSheet);
    }

    // Setup drag event listeners on the document
    const handleDragStart = (e) => {
      if (e.target.classList.contains("drag-item")) {
        const word =
          e.target.getAttribute("data-word") || e.target.textContent.trim();
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", word);
        console.log("Started dragging:", word);
      }
    };

    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
};
