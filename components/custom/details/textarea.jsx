import React from "react";
const Textarea = ({ title, register, name, validation, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {title && (
        <label className="text-sm font-semibold text-gray-600">{title}</label>
      )}
      <textarea
        {...register(name, validation)}
        {...props}
        className="border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-main outline-none transition"
      />
    </div>
  );
};

export default Textarea;
