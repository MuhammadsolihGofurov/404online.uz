"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Trash2, MapPin, MousePointer2 } from "lucide-react";

const DiagramComponent = ({ node, updateAttributes, deleteNode }) => {
  const { src, labels } = node.attrs;

  // Add a marker/label function
  const addLabel = (e) => {
    if (!src) return; // Cannot add point if there is no image

    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate coordinates as percentage of image size for responsiveness
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const number = window.prompt("Enter question number (e.g., 14):");
    const answer = window.prompt("Enter the correct answer for this question:");

    if (number && answer !== null) {
      const newLabels = [...labels, { x, y, number, answer }];
      updateAttributes({ labels: newLabels });
    }
  };

  // Remove a marker
  const removeLabel = (index, e) => {
    e.stopPropagation(); // Prevent trigger addLabel on click
    const newLabels = labels.filter((_, i) => i !== index);
    updateAttributes({ labels: newLabels });
  };

  return (
    <NodeViewWrapper className="diagram-container my-8 p-5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
              Diagram / Map Labeling
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              Click on the image to place a question marker
            </p>
          </div>
        </div>
        <button
          onClick={deleteNode}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Image and Markers Section */}
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 min-h-[200px] flex items-center justify-center">
        {src ? (
          <div
            className="relative inline-block w-full cursor-crosshair group"
            onClick={addLabel}
          >
            <img
              src={src}
              alt="IELTS Task Diagram"
              className="w-full h-auto block select-none"
              draggable={false}
            />

            {/* Overlay Grid (Admin Instructions) */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors pointer-events-none flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm border border-blue-100 transition-opacity">
                <MousePointer2 size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  Click to add marker
                </span>
              </div>
            </div>

            {/* Markers (Labels) */}
            {labels.map((label, index) => (
              <div
                key={index}
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group/marker"
              >
                {/* Marker Design */}
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white ring-4 ring-blue-600/20 group-hover/marker:scale-110 transition-transform">
                  {label.number}
                </div>

                {/* Tooltip (View Answer & Delete) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/marker:flex flex-col items-center z-10">
                  <div className="bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-2xl flex items-center gap-3 whitespace-nowrap">
                    <span className="font-medium">
                      Answer:{" "}
                      <span className="text-emerald-400 font-bold">
                        {label.answer}
                      </span>
                    </span>
                    <button
                      onClick={(e) => removeLabel(index, e)}
                      className="bg-red-500/20 hover:bg-red-500 p-1 rounded transition-colors text-red-400 hover:text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5 shadow-sm"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <MapPin size={32} />
            </div>
            <p className="text-sm text-slate-400 font-medium italic">
              Main image not loaded. Please upload an image from the field
              above.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info List */}
      {labels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {labels.map((l, i) => (
            <div
              key={i}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-500"
            >
              Q{l.number}: {l.answer}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const DiagramBlock = Node.create({
  name: "diagramBlock",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      labels: { default: [] }, // Format: [{ x: number, y: number, number: string, answer: string }]
    };
  },

  parseHTML: () => [{ tag: 'div[data-type="diagram-block"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-type": "diagram-block" }),
    0,
  ],

  addNodeView: () => ReactNodeViewRenderer(DiagramComponent),
});
