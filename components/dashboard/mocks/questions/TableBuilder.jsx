import React from "react";
import { Plus, Trash2, Check } from "lucide-react";

export default function TableBuilder({
  mode = "completion",
  content,
  correctAnswer,
  onContentChange,
  onAnswerChange,
}) {
  const columns = content?.columns || [];
  const rows = content?.rows || [];

  const updateContent = (key, value) => {
    onContentChange({ ...content, [key]: value });
  };

  const completionValues = correctAnswer?.values || {};
  const matchingSelections = correctAnswer?.selections || {};

  const handleRowLabelChange = (rowId, label) => {
    updateContent(
      "rows",
      rows.map((row) => (row.id === rowId ? { ...row, label } : row))
    );
  };

  const handleCellChange = (rowId, columnIndex, value) => {
    updateContent(
      "rows",
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const cells = [...(row.cells || [])];
        cells[columnIndex] = value;
        return { ...row, cells };
      })
    );
  };

  const handleAnswerChange = (rowId, columnIndex, value) => {
    const key = `${rowId}_col${columnIndex}`;
    const next = { ...completionValues };
    if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onAnswerChange({ values: next });
  };

  const toggleSelection = (rowId, column) => {
    const currentRow = new Set(matchingSelections[rowId] || []);
    if (currentRow.has(column)) {
      currentRow.delete(column);
    } else {
      currentRow.add(column);
    }
    onAnswerChange({
      selections: {
        ...matchingSelections,
        [rowId]: [...currentRow],
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Columns
          </label>
          {columns.map((col, idx) => (
            <div
              key={`${col}-${idx}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <input
                type="text"
                value={col}
                onChange={(e) =>
                  updateContent(
                    "columns",
                    columns.map((c, cIdx) =>
                      cIdx === idx ? e.target.value : c
                    )
                  )
                }
                placeholder={`Column ${idx + 1}`}
                className="flex-1 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateContent(
                    "columns",
                    columns.filter((_, cIdx) => cIdx !== idx)
                  )
                }
                className="text-red-500 hover:text-red-600 disabled:opacity-40"
                disabled={columns.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateContent("columns", [...columns, ""])}
            className="inline-flex items-center gap-2 rounded-full bg-main px-4 py-2 text-white text-sm"
          >
            <Plus size={16} />
            Add column
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Rows
          </label>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <input
                type="text"
                value={row.label}
                onChange={(e) => handleRowLabelChange(row.id, e.target.value)}
                placeholder={`Row ${idx + 1}`}
                className="flex-1 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateContent(
                    "rows",
                    rows.filter((item) => item.id !== row.id)
                  )
                }
                className="text-red-500 hover:text-red-600 disabled:opacity-40"
                disabled={rows.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateContent("rows", [
                ...rows,
                { id: crypto.randomUUID(), label: "", cells: [] },
              ])
            }
            className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/10"
          >
            <Plus size={16} />
            Add row
          </button>
        </div>
      </div>

      {mode === "completion" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Row label
                </th>
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {column || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {row.label || "Untitled row"}
                  </td>
                  {columns.map((_, columnIndex) => {
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Row label
                </th>
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {column || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {row.label || "Untitled row"}
                  </td>
                  {columns.map((column, columnIndex) => {
                    const isSelected = (matchingSelections[row.id] || []).includes(
                      column
                    );
                    return (
                      <td key={columnIndex} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelection(row.id, column)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                            isSelected
                              ? "border-main bg-main/10 text-main"
                              : "border-slate-200 text-slate-500 hover:border-main/60"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Check
                              size={14}
                              className={isSelected ? "opacity-100" : "opacity-0"}
                            />
                            {column || `Column ${columnIndex + 1}`}
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
      )}
    </div>
  );
}

