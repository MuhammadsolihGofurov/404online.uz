"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingTitleComponent = () => {
  return (
    <NodeViewWrapper
      as="div"
      className="matching-title text-lg font-bold mb-3"
      data-node-view-wrapper=""
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingTitle = Node.create({
  name: "matchingTitle",
  group: "block",
  content: "text*",

  parseHTML() {
    return [
      {
        tag: 'div[class="matching-title"]',
        priority: 100,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "matching-title" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyMatchingTitleComponent);
  },
});
