"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";

const ReadOnlyMatchingContainerComponent = () => {
  return (
    <NodeViewWrapper
      as="div"
      className="matching-container"
      data-node-view-wrapper=""
    >
      <NodeViewContent className="matching-content" />
    </NodeViewWrapper>
  );
};

export const ReadOnlyMatchingContainer = Node.create({
  name: "matchingContainer",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[class="matching-container"]',
        priority: 100,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "matching-container" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyMatchingContainerComponent);
  },
});
