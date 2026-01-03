import React from "react";
import dynamic from "next/dynamic";
import { Controller } from "react-hook-form";

// SSR xatoligini oldini olish uchun dynamic import
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full bg-gray-100 animate-pulse rounded-xl" />
  ),
});
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
];

const RichTextEditor = ({
  control,
  name,
  label,
  error,
  placeholder = "Start typing...",
  required = false,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-textSecondary font-semibold text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className={`rich-text-wrapper ${error ? "border-red-500" : ""}`}>
        <Controller
          name={name}
          control={control}
          rules={{ required: required ? "This field is required" : false }}
          render={({ field }) => (
            <ReactQuill
              theme="snow"
              value={field.value || ""}
              onChange={field.onChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              className="bg-white rounded-xl overflow-hidden"
            />
          )}
        />
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message}
        </span>
      )}

      <style jsx global>{`
        .ql-container {
          min-height: 250px;
          font-size: 16px;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          overflow-y: scroll;
        }
        .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
