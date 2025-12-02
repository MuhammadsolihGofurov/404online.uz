import React, { useCallback, useRef, memo } from "react";
import { RichText } from "@/components/ui/RichText";
import { LocalInput } from "./LocalInput";
import { safeText } from "./utils";

export const TableRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, content, question_number } = question;
  const columns = content?.columns || [];
  const rows = content?.rows || [];
  const currentValues = value?.values || {};

  // PERFORMANCE FIX: Use ref to avoid recreating callback on every cell change
  const valuesRef = useRef(currentValues);
  valuesRef.current = currentValues;

  const handleCellChange = useCallback((key, val) => {
    onChange({ values: { ...valuesRef.current, [key]: val } });
  }, [onChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">Q{question_number}</span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-16 overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-4 bg-gray-50 border-b border-r border-gray-200 text-left font-bold text-gray-700 min-w-[150px] last:border-r-0">
                  <RichText content={safeText(col)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const cells = row.cells || [];
              const rowId = row.id || rIdx;
              return (
                <tr key={rIdx} className="hover:bg-gray-50/50">
                  {cells.map((cell, cIdx) => {
                    const isBlank = typeof cell === 'string' && (cell.includes("___") || cell === "");
                    const cellKey = `${rowId}_col${cIdx}`;
                    
                    return (
                      <td key={cIdx} className="p-4 border-b border-r border-gray-200 align-top last:border-r-0">
                        {isBlank ? (
                          <LocalInput
                            value={currentValues[cellKey] || ""}
                            onChange={(v) => handleCellChange(cellKey, v)}
                            disabled={disabled}
                            className="w-full min-w-[120px] p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                            placeholder="Answer"
                          />
                        ) : (
                          <span className="text-gray-800 leading-relaxed"><RichText content={cell} /></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

TableRenderer.displayName = "TableRenderer";

