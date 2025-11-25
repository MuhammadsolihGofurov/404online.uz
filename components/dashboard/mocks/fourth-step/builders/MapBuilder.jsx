/**
 * MapBuilder Component
 * Handles MAP_LABELLING question type
 */

import React, { useCallback } from "react";
import { createId } from "../utils/questionConfig";

export function MapBuilder({
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const regions = content?.regions || [];
  const labels = correctAnswer?.labels || {};

  const updateRegion = useCallback((id, key, value) => {
    onContentChange({
      ...content,
      regions: regions.map((region) =>
        region.id === id
          ? {
              ...region,
              [key]:
                key === "coordinates"
                  ? { ...region.coordinates, ...value }
                  : value,
            }
          : region
      ),
    });
  }, [content, regions, onContentChange]);

  const updateLabel = useCallback((id, value) => {
    onAnswerChange({
      labels: { ...labels, [id]: value },
    });
  }, [labels, onAnswerChange]);

  const addRegion = useCallback(() => {
    onContentChange({
      ...content,
      regions: [
        ...regions,
        {
          id: createId(),
          label: `Region ${regions.length + 1}`,
          coordinates: { x: 0, y: 0 },
        },
      ],
    });
  }, [content, regions, onContentChange]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Map image URL
        </label>
        <input
          type="url"
          value={content?.map_image_url || ""}
          onChange={(e) =>
            onContentChange({
              ...content,
              map_image_url: e.target.value,
            })
          }
          placeholder="https://..."
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">
          Instructions
        </label>
        <textarea
          rows={3}
          value={content?.instructions || ""}
          onChange={(e) =>
            onContentChange({
              ...content,
              instructions: e.target.value,
            })
          }
          className="w-full px-4 py-3 mt-2 text-sm border rounded-2xl border-slate-200 focus:border-main focus:ring-4 focus:ring-main/10"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Regions</p>
          <button
            type="button"
            onClick={addRegion}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-full bg-main"
          >
            + Region
          </button>
        </div>
        <div className="space-y-4">
          {regions.map((region) => (
            <div
              key={region.id}
              className="grid gap-3 p-4 bg-white border rounded-2xl border-slate-200 md:grid-cols-2"
            >
              <input
                type="text"
                value={region.label}
                onChange={(e) => updateRegion(region.id, "label", e.target.value)}
                placeholder="Region label"
                className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
              />
              <input
                type="text"
                value={labels[region.id] || ""}
                onChange={(e) => updateLabel(region.id, e.target.value)}
                placeholder="Correct letter/value"
                className="px-3 py-2 text-sm border border-dashed rounded-xl border-slate-300 focus:border-main focus:ring-2 focus:ring-main/10"
              />
              <input
                type="number"
                value={region.coordinates?.x || 0}
                onChange={(e) =>
                  updateRegion(region.id, "coordinates", {
                    x: Number(e.target.value),
                  })
                }
                placeholder="X (0-100)"
                className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
              />
              <input
                type="number"
                value={region.coordinates?.y || 0}
                onChange={(e) =>
                  updateRegion(region.id, "coordinates", {
                    y: Number(e.target.value),
                  })
                }
                placeholder="Y (0-100)"
                className="px-3 py-2 text-sm border rounded-xl border-slate-200 focus:border-main focus:ring-2 focus:ring-main/10"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

