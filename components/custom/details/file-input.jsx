import React from "react";
import { Controller } from "react-hook-form";

export default function FileInput({
  label,
  name,
  control,
  rules,
  errors,
  accept = "*",
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div className="flex flex-col w-full items-start">
          {label && (
            <label className="text-textSecondary font-semibold text-sm pb-2">
              {label}
            </label>
          )}
          <input
            type="file"
            accept={accept}
            onChange={(e) => field.onChange(e.target.files[0])}
            className="border  bg-white border-gray-300 rounded-lg px-2 py-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 h-[57.6px]"
          />
          {errors?.[name] && (
            <span className="text-red-500 mt-1 text-sm">
              {errors[name]?.message}
            </span>
          )}
        </div>
      )}
    />
  );
}
