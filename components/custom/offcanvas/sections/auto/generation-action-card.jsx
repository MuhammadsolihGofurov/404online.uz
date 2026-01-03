import React, { useEffect } from "react";
import { Upload, PlusCircle, Sparkles, Plus } from "lucide-react";

/**
 * @param {Function} onScan - Rasm yuklanganda chaqiriladigan funksiya
 * @param {Function} onAdd - Qo'lda savol qo'shish tugmasi bosilganda chaqiriladigan funksiya
 * @param {Boolean} loading - AI skanerlash holati
 * @param {String} scanLabel - Skaner tugmasi matni
 * @param {String} addLabel - Qo'shish tugmasi matni
 * @param {String} addSubLabel - Qo'shimcha tushuntirish matni
 */
export default function GeneratorActionCards({
  onScan,
  onAdd,
  loading,
  scanLabel = "AI Scanner",
  addLabel = "Add New",
  addSubLabel = "",
}) {
  // --- CTRL + V MANTIQI ---
  useEffect(() => {
    const handlePaste = (event) => {
      if (loading) return; // Yuklanayotgan bo'lsa kutish

      const items = event.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) files.push(blob);
        }
      }

      if (files.length > 0) {
        // Fake event ob'ektini yasab, onScan-ga jo'natamiz
        // onScan funksiyasi e.target.files dan foydalanadi
        const fakeEvent = {
          target: {
            files: files,
          },
        };
        onScan(fakeEvent);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onScan, loading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* AI SCANNER CARD */}
      <label className="md:col-span-2 group relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-3xl bg-white hover:bg-gray-50 hover:border-indigo-400 transition-all cursor-pointer">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mb-2" />
            <p className="text-xs font-medium text-gray-500 italic">
              Processing image...
            </p>
          </div>
        ) : (
          <>
            <div className="bg-indigo-50 p-3 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
              <Sparkles size={24} className="text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">{scanLabel}</p>
            <p className="text-[10px] text-gray-400">
              Upload, Drag & Drop or{" "}
              <span className="text-indigo-600 font-bold">Paste (Ctrl+V)</span>
            </p>
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onScan}
          className="hidden"
          disabled={loading}
        />
      </label>

      {/* MANUAL ADD CARD */}
      <button
        type="button"
        onClick={onAdd}
        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-3xl bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
      >
        <div className="bg-emerald-50 p-3 rounded-2xl mb-2 group-hover:rotate-90 transition-transform">
          <Plus size={24} className="text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-gray-700">{addLabel}</p>
        {addSubLabel && (
          <p className="text-[10px] text-gray-400">{addSubLabel}</p>
        )}
      </button>
    </div>
  );
}
