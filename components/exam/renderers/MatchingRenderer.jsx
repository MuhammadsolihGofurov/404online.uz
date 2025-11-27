import React, { useCallback, memo } from "react";
import { RichText } from "@/components/ui/RichText";
import { safeText } from "./utils";

export const MatchingRenderer = memo(({ question, value, onChange, disabled }) => {
  const { prompt, content, question_number } = question;
  const listA = content?.list_a || []; // Rows
  const listB = content?.list_b || []; // Columns
  const currentMatches = value?.matches || []; // [{from: rowId, to: colId}]

  const handleSelect = useCallback((rowId, colId) => {
    if (disabled) return;
    // Radio behavior: One selection per row
    const newMatches = currentMatches.filter(m => m.from !== rowId);
    newMatches.push({ from: rowId, to: colId });
    onChange({ matches: newMatches });
  }, [currentMatches, onChange, disabled]);

  return (
    <div className="space-y-8">
       <div className="flex items-start gap-4">
        <span className="font-bold text-gray-700 text-lg min-w-[3rem]">Q{question_number}</span>
        <div className="prose max-w-none text-gray-800">
          <RichText content={prompt} />
        </div>
      </div>

      <div className="ml-16 overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 bg-gray-50 border-b border-gray-200"></th>
              {listB.map((col, idx) => (
                <th key={idx} className="p-4 bg-gray-50 border-b border-l border-gray-200 text-sm font-bold text-gray-700 min-w-[100px]">
                  {safeText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listA.map((row, rIdx) => {
              const rowId = safeText(row.id || row);
              const rowText = safeText(row.text || row);
              return (
                <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700 border-r bg-gray-50/30">
                    <RichText content={rowText} />
                  </td>
                  {listB.map((col, cIdx) => {
                    const colId = safeText(col.id || col);
                    const isSelected = currentMatches.some(m => m.from === rowId && m.to === colId);
                    return (
                      <td 
                        key={cIdx} 
                        className={`p-4 border-b border-l border-gray-200 text-center cursor-pointer transition-all ${isSelected ? 'bg-blue-100' : ''}`}
                        onClick={() => handleSelect(rowId, colId)}
                      >
                        <div className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600 shadow-sm' : 'border-gray-300 bg-white hover:border-blue-400'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
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

MatchingRenderer.displayName = "MatchingRenderer";

