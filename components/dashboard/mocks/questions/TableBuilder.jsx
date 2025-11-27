import React, { useCallback, useMemo } from "react";
import { Plus, Trash2, Check } from "lucide-react";

// ============================================================================
// DATA NORMALIZATION HELPERS
// ============================================================================

/**
 * Extract text from column item (handles both string and object formats)
 * Backend serializer returns: { id: "uuid", text: "Label", value: "val" }
 * Legacy format: "Label" (string)
 * 
 * @param {string|object} item - Column item from backend
 * @returns {string} - Display text
 */
const getColumnText = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item.text || item.value || '';
  }
  return item || '';
};

/**
 * Extract value/ID from column item for selection logic
 * @param {string|object} item - Column item
 * @returns {string} - Value to use for selection keys
 */
const getColumnValue = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item.value || item.text || '';
  }
  return item || '';
};

/**
 * Extract text from row item
 * Rows use { id: "uuid", label: "text", cells: [] }
 * @param {object} row - Row object
 * @returns {string} - Display text
 */
const getRowText = (row) => {
  if (typeof row === 'object' && row !== null) {
    return row.label || '';
  }
  return row || '';
};

// ============================================================================
// EXTRACTED SUB-COMPONENTS (Prevent Re-mounting)
// ============================================================================

/**
 * ColumnInputItem - Memoized component for column input
 * Prevents focus loss by avoiding re-mounting on parent state changes
 * FIXED: Now handles both string and object formats from backend
 */
const ColumnInputItem = React.memo(({ column, index, onUpdate, onDelete, canDelete }) => {
  const displayText = getColumnText(column);
  
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <input
        type="text"
        value={displayText}
        onChange={(e) => onUpdate(index, e.target.value, column)}
        placeholder={`Column ${index + 1}`}
        className="flex-1 text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="text-red-500 hover:text-red-600 disabled:opacity-40"
        disabled={!canDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});
ColumnInputItem.displayName = 'ColumnInputItem';

/**
 * RowInputItem - Memoized component for row input
 * Prevents focus loss by avoiding re-mounting on parent state changes
 * Rows already use object format: { id, label, cells }
 */
const RowInputItem = React.memo(({ row, index, onUpdate, onDelete, canDelete }) => {
  const displayText = getRowText(row);
  
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <input
        type="text"
        value={displayText}
        onChange={(e) => onUpdate(row.id, e.target.value)}
        placeholder={`Row ${index + 1}`}
        className="flex-1 text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => onDelete(row.id)}
        className="text-red-500 hover:text-red-600 disabled:opacity-40"
        disabled={!canDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});
RowInputItem.displayName = 'RowInputItem';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TableBuilder({
  mode = "completion",
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const columns = content?.columns || [];
  const rows = content?.rows || [];

  // 🛡️ CRITICAL: Safety limits to prevent browser crash
  const MAX_SAFE_COLUMNS = 26; // A-Z is standard maximum
  const MAX_SAFE_ROWS = 50; // Reasonable limit for table rows
  const safeColumns = columns.length > MAX_SAFE_COLUMNS ? columns.slice(0, MAX_SAFE_COLUMNS) : columns;
  const safeRows = rows.length > MAX_SAFE_ROWS ? rows.slice(0, MAX_SAFE_ROWS) : rows;
  const hasExceededColumnLimit = columns.length > MAX_SAFE_COLUMNS;
  const hasExceededRowLimit = rows.length > MAX_SAFE_ROWS;

  const completionValues = correctAnswer?.values || {};
  const matchingSelections = correctAnswer?.selections || {};

  // Memoized update function for content
  const updateContent = useCallback((key, value) => {
    onContentChange({ ...content, [key]: value });
  }, [content, onContentChange]);

  // Memoized handlers for columns
  const handleColumnUpdate = useCallback((index, newText, originalItem) => {
    const newColumns = columns.map((col, idx) => {
      if (idx !== index) return col;
      
      // If original was an object, preserve its structure
      if (typeof originalItem === 'object' && originalItem !== null) {
        return {
          ...originalItem,
          text: newText,
          value: newText, // Update value to match text for consistency
        };
      }
      
      // If original was a string, return string
      return newText;
    });
    updateContent("columns", newColumns);
  }, [columns, updateContent]);

  const handleColumnDelete = useCallback((index) => {
    const newColumns = columns.filter((_, idx) => idx !== index);
    updateContent("columns", newColumns);
  }, [columns, updateContent]);

  const handleColumnAdd = useCallback(() => {
    updateContent("columns", [...columns, ""]);
  }, [columns, updateContent]);

  // Memoized handlers for rows
  const handleRowLabelChange = useCallback((rowId, label) => {
    const newRows = rows.map((row) => (row.id === rowId ? { ...row, label } : row));
    updateContent("rows", newRows);
  }, [rows, updateContent]);

  const handleRowDelete = useCallback((rowId) => {
    const newRows = rows.filter((row) => row.id !== rowId);
    updateContent("rows", newRows);
  }, [rows, updateContent]);

  const handleRowAdd = useCallback(() => {
    const newRows = [
      ...rows,
      { id: crypto.randomUUID(), label: "", cells: [] },
    ];
    updateContent("rows", newRows);
  }, [rows, updateContent]);

  // Handlers for table cells (completion mode)
  const handleCellChange = useCallback((rowId, columnIndex, value) => {
    const newRows = rows.map((row) => {
        if (row.id !== rowId) return row;
        const cells = [...(row.cells || [])];
        cells[columnIndex] = value;
        return { ...row, cells };
    });
    updateContent("rows", newRows);
  }, [rows, updateContent]);

  const handleAnswerChange = useCallback((rowId, columnIndex, value) => {
    const key = `${rowId}_col${columnIndex}`;
    const next = { ...completionValues };
    if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onAnswerChange({ values: next });
  }, [completionValues, onAnswerChange]);

  /**
   * Toggle selection for MATCHING_TABLE_CLICK
   * Memoized to prevent unnecessary re-renders
   */
  const toggleSelection = useCallback((rowId, column, allowMultiple = false) => {
    // Get current selections for this row
    const currentSelections = matchingSelections[rowId] || [];
    let newSelections;

    if (allowMultiple) {
      // Multi-select (checkbox behavior)
      const currentRow = new Set(currentSelections);
      if (currentRow.has(column)) {
        currentRow.delete(column);
      } else {
        currentRow.add(column);
      }
      newSelections = [...currentRow];
    } else {
      // Single-select (radio behavior) - DEFAULT for IELTS
      if (currentSelections.includes(column)) {
        // Clicking the same cell again deselects it
        newSelections = [];
      } else {
        // Replace any previous selection with this one
        newSelections = [column];
      }
    }

    // Build updated selections object
    const updatedSelections = {
      ...matchingSelections,
      [rowId]: newSelections,
    };

    // Remove empty arrays to keep data clean
    if (newSelections.length === 0) {
      delete updatedSelections[rowId];
    }

    // Log for debugging (remove in production)
    console.log('TableBuilder Selection:', {
      rowId,
      column,
      newSelections,
      updatedSelections
    });

    // Update parent component state
    onAnswerChange({
      selections: updatedSelections,
    });
  }, [matchingSelections, onAnswerChange]);

  return (
    <div className="space-y-5">
      {/* Warning Messages */}
      {(hasExceededColumnLimit || hasExceededRowLimit) && (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
          <p className="font-semibold text-red-700">⚠️ Table Size Limit Exceeded</p>
          {hasExceededColumnLimit && (
            <p className="text-sm text-red-600">
              You have {columns.length} columns, but only the first {MAX_SAFE_COLUMNS} are shown to prevent browser crash.
            </p>
          )}
          {hasExceededRowLimit && (
            <p className="text-sm text-red-600">
              You have {rows.length} rows, but only the first {MAX_SAFE_ROWS} are shown to prevent browser crash.
            </p>
          )}
          <p className="mt-2 text-sm font-semibold text-red-700">
            Please reduce the table size or adjust the question range.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columns Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Columns ({columns.length}/{MAX_SAFE_COLUMNS})
          </label>
          {safeColumns.map((col, idx) => (
            <ColumnInputItem
              key={idx}
              column={col}
              index={idx}
              onUpdate={handleColumnUpdate}
              onDelete={handleColumnDelete}
              canDelete={columns.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={handleColumnAdd}
            className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
            disabled={columns.length >= MAX_SAFE_COLUMNS}
          >
            <Plus size={16} />
            Add column
          </button>
        </div>

        {/* Rows Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Rows ({rows.length}/{MAX_SAFE_ROWS})
          </label>
          {safeRows.map((row, idx) => (
            <RowInputItem
              key={row.id}
              row={row}
              index={idx}
              onUpdate={handleRowLabelChange}
              onDelete={handleRowDelete}
              canDelete={rows.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={handleRowAdd}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={rows.length >= MAX_SAFE_ROWS}
          >
            <Plus size={16} />
            Add row
          </button>
        </div>
      </div>

      {/* Show current selections for MATCHING mode */}
      {mode === "matching" && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Check size={18} className="text-blue-600" />
            Correct Answers Selected
          </h3>
          <div className="space-y-2">
            {rows.length > 0 && rows.every((row) => (matchingSelections[row.id] || []).length === 0) && (
              <p className="text-sm text-blue-700 italic">
                👆 Click on cells in the table below to mark correct answers.
              </p>
            )}
            {rows.map((row) => {
              const selections = matchingSelections[row.id] || [];
              if (selections.length === 0) return null;
              return (
                <div key={row.id} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-800">
                    {getRowText(row) || "Untitled row"}:
                  </span>
                  <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow-sm flex items-center gap-2">
                    <Check size={14} />
                    {selections.join(", ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "completion" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Row label
                </th>
                {safeColumns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {getColumnText(column) || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {safeRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {getRowText(row) || "Untitled row"}
                  </td>
                  {safeColumns.map((_, columnIndex) => {
                    const key = `${row.id}_col${columnIndex}`;
                    return (
                      <td key={columnIndex} className="px-4 py-3 space-y-2">
                        <input
                          type="text"
                          value={row.cells?.[columnIndex] || ""}
                          onChange={(e) =>
                            handleCellChange(row.id, columnIndex, e.target.value)
                          }
                          placeholder="Visible text"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-main focus:ring-2 focus:ring-main/10"
                        />
                        <input
                          type="text"
                          value={completionValues[key] || ""}
                          onChange={(e) =>
                            handleAnswerChange(row.id, columnIndex, e.target.value)
                          }
                          placeholder="Correct answer"
                          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600 focus:border-main focus:ring-2 focus:ring-main/10"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl">
            <p className="text-sm text-slate-800">
              <span className="font-bold text-slate-900">📋 Instructions:</span> Click on cells to mark the correct answer for each row.
            </p>
            <p className="text-xs text-slate-600 mt-2">
              • Selected cells will turn <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-semibold text-xs">BLUE</span>
              • Only one answer per row (radio behavior)
              • Click again to deselect
            </p>
          </div>
          
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Row label
                </th>
                {safeColumns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {getColumnText(column) || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {safeRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {getRowText(row) || "Untitled row"}
                  </td>
                  {safeColumns.map((column, columnIndex) => {
                    const columnValue = getColumnValue(column);
                    const columnText = getColumnText(column);
                    const isSelected = (matchingSelections[row.id] || []).includes(columnValue);
                    
                    return (
                      <td key={columnIndex} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelection(row.id, columnValue)}
                          className={`w-full rounded-lg px-4 py-3 text-center font-semibold transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-600 border-2 border-blue-600 text-white shadow-md"
                              : "bg-white border-2 border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-400"
                          }`}
                          title={isSelected ? "✓ Selected as correct answer (click to deselect)" : "Click to select as correct answer"}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {isSelected && (
                            <Check
                                size={18}
                                className="flex-shrink-0 font-bold"
                            />
                            )}
                            <span className={isSelected ? "font-bold" : "font-semibold"}>
                              {columnText || `Column ${columnIndex + 1}`}
                            </span>
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}

