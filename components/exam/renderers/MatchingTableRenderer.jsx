import React, { memo, useEffect, useState } from "react";

/**
 * Matching Table Renderer
 * Renders a grid where rows are items and columns are options (e.g., A, B, C, D).
 * Users select one option per row (Radio button logic per row).
 */
export const MatchingTableRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, content } = question;
  // Content structure expected:
  // {
  //   rows: [{id: 1, text: "Question text", label: "16"}, ...],
  //   columns: [{id: "A", text: "Option A"}, {id: "B", text: "Option B"}, ...]
  // }

  // Safe access to rows and columns
  const rows = content?.rows || [];
  const columns = content?.columns || [];

  // Value format: { "row_id_1": "column_id_A", "row_id_2": "column_id_B" }
  const currentAnswers = value || {};

  const handleSelect = (rowId, colId) => {
    if (disabled) return;
    onChange({
      ...currentAnswers,
      [rowId]: colId
    });
  };

  return (
    <div className="space-y-6">
      {/* Prompt/Instructions */}
      {prompt && (
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: prompt }} />
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              {columns.map((col) => (
                <th key={col.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-gray-900 text-base">{col.text || col.value || col.id}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => {
              // Row ID is usually the question ID or index provided in content
              const rowId = String(row.id);
              const selectedColId = currentAnswers[rowId];

              return (
                <tr key={rowId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[2.5rem]">{row.label && !row.text?.includes(row.label) ? row.label : ''}</span>
                      <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: row.text || row.label || rowId }} />
                    </div>
                  </td>
                  {columns.map((col) => {
                    const isSelected = selectedColId === col.id;
                    return (
                      <td
                        key={`${rowId}-${col.id}`}
                        className="px-2 py-3 text-center"
                      >
                        <button
                          onClick={() => handleSelect(rowId, col.id)}
                          disabled={disabled}
                          className={`
                            w-full py-3 px-2 rounded-lg font-bold text-sm transition-all transform active:scale-95
                            ${isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-2"
                              : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            }
                            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          `}
                        >
                          {col.value || col.id}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Column Legend (if columns have detailed text) */}
      {columns.some(col => col.text && col.text !== (col.value || col.id)) && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Options:</h4>
          <div className="grid grid-cols-1 gap-y-2">
            {columns.map(col => (
              <div key={col.id} className="text-sm flex gap-2">
                <span className="font-bold text-gray-900">{col.value || col.id}:</span>
                <span className="text-gray-600 whitespace-pre-wrap">{col.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MatchingTableRenderer.displayName = "MatchingTableRenderer";

