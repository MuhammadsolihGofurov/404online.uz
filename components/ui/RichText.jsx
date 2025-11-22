import React from "react";

/**
 * RichText Component
 * 
 * Safely renders HTML content using dangerouslySetInnerHTML.
 * Use this for rendering HTML strings from the backend (prompts, instructions, etc.)
 * 
 * @param {string} content - HTML string to render
 * @param {string} className - Additional CSS classes
 */
export function RichText({ content, className = "" }) {
  if (!content) {
    return null;
  }

  // If content is not a string, convert it to string
  const htmlContent = typeof content === "string" ? content : String(content);

  // If content doesn't contain HTML tags, render as plain text
  if (!/<[^>]+>/.test(htmlContent)) {
    return <span className={className}>{htmlContent}</span>;
  }

  return (
    <div
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

