import React, { useState } from "react";
import { toast } from "react-toastify";
import { LucideScanEye, LucideImagePlus } from "lucide-react";
import { scanIELTSWithGemini } from "@/utils/gemini-service";
import { ButtonSpinner } from "@/components/custom/loading";

export const GeminiScanner = ({ questionType, onScanComplete }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const startScan = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Iltimos, avval rasm yuklang!");
      return;
    }

    try {
      setLoading(true);
      const data = await scanIELTSWithGemini(selectedFiles, questionType);
      const htmlContent = parseGeminiToTiptap(data, questionType);
      onScanComplete(htmlContent);

      toast.success("AI ma'lumotlarni muvaffaqiyatli parse qildi!");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Scanning error:", error);
      toast.error(error.message || "Skanerlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const parseGeminiToTiptap = (data, type) => {
    // 1. GAP FILL / COMPLETION / SUMMARY / TABLE
    if (
      [
        "COMPLETION",
        "SENTENCE",
        "SHORT_ANSWER",
        "SUMMARY",
        "TABLE_FLOWCHART",
      ].includes(type)
    ) {
      let textContent = data.full_text || "";
      data.questions?.forEach((q) => {
        const placeholder = `{{${q.number}}}`;
        const component = `<question-input number="${q.number}" answer="${q.answer}"></question-input>`;
        textContent = textContent.split(placeholder).join(component);
      });

      if (type === "SUMMARY" || type === "TABLE_FLOWCHART") {
        return `<div data-type="summary-block" title="${
          data.title || ""
        }"><p>${textContent}</p></div>`;
      }
      return `<p>${textContent}</p>`;
    }

    // 2. MULTIPLE CHOICE (MCQ)
    if (type === "MCQ") {
      const questions = Array.isArray(data) ? data : [data];
      return questions
        .map((q) => {
          const optionsJson = JSON.stringify(q.options);
          return `<div data-type="choice-group" questionNumber="${
            q.questionNumber
          }" title="${q.title}" type="${q.type || "single"}" answer="${
            q.answer
          }">${optionsJson}</div>`;
        })
        .join("");
    }

    // 3. BOOLEAN (TFNG / YNNG)
    if (["TFNG", "YNNG"].includes(type)) {
      const boolType = type.toLowerCase();
      const questionsHtml = data.questions
        ?.map(
          (q) => `
        <div data-type="boolean-question" number="${q.number}" answer="${q.answer}" type="${boolType}">
          ${q.text}
        </div>
      `
        )
        .join("");
      return `<div data-type="boolean-block" type="${boolType}" title="${
        data.title || ""
      }">${questionsHtml}</div>`;
    }

    // 4. MATCHING (Headings, Info, Features, Endings)
    if (type.startsWith("MATCH")) {
      const questionsHtml = data.questions
        ?.map(
          (q) => `
        <div data-type="matching-question" number="${q.number}" answer="${q.answer}">
          ${q.text}
        </div>
      `
        )
        .join("");
      return `<div data-type="matching-block" type="${
        data.type || "matching-headings"
      }" title="${data.title || ""}" options="${
        data.options || ""
      }">${questionsHtml}</div>`;
    }

    // 5. DIAGRAM / MAP
    if (type === "DIAGRAM" || type === "MAP_DIAGRAM") {
      const labelsJson = JSON.stringify(data.labels || []);
      // Rasm src keyinchalik editor ichida rasm yuklanganda yangilanadi
      return `<div data-type="diagram-block" labels='${labelsJson}' src=""></div>`;
    }

    return "";
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 rounded-2xl border-2 border-dashed border-blue-200 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">
            AI Scanner (Gemini 1.5 Flash)
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl shadow-sm border border-blue-100 hover:border-blue-400 transition-all text-slate-700">
              <LucideImagePlus size={20} className="text-blue-500" />
              <span className="text-sm font-medium">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} ta rasm tanlandi`
                  : "Rasm yuklang"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-red-500 hover:underline"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={startScan}
          disabled={loading || !questionType}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
        >
          {loading ? <ButtonSpinner /> : <LucideScanEye size={22} />}
          {loading ? "Skanerlanmoqda..." : "AI bilan to'ldirish"}
        </button>
      </div>
    </div>
  );
};
