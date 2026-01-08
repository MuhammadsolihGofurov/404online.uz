"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingOptionsBoxComponent = () => {
  return (
    <NodeViewWrapper
      as="div"
      className="matching-options-box"
      style={{
        background: "#ffffff",
        color: "#0f172a",
        padding: "1rem 1.25rem",
        borderRadius: "0.5rem",
        fontWeight: "600",
        margin: "1rem 0",
        border: "2px solid #3b82f6",
        boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.06)",
        whiteSpace: "pre-line",
        lineHeight: "1.8",
        fontSize: "1rem",
      }}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingOptionsBox = Node.create({
  name: "matchingOptionsBox",
  group: "block",
  content: "text*",
  atom: false,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[class="matching-options-box"]',
        priority: 100,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "matching-options-box" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyMatchingOptionsBoxComponent);
  },
});
