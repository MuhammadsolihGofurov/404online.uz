import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
  name,
  title,
  placeholder = "Select...",
  options = [],
  multiple = false,
  required,
  noSelected = false,
  register = () => {},
  validation,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(multiple ? [] : null);

  const handleSelect = (value) => {
    if (multiple) {
      // multiple toggle
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else {
      setSelected(value);
      setOpen(false);
    }
  };

  return (
    <label className="flex flex-col items-start w-full gap-2 sm:bg-transparent bg-white rounded-xl relative">
      {title && (
        <span className="text-textSecondary font-semibold text-sm">
          {title}
        </span>
      )}

      <div className="relative w-full">
        {/* Selected box */}
        <div
          className={`rounded-xl p-4 w-full border border-buttonGrey cursor-pointer select-none flex items-center justify-between ${
            error ? "border-red-500" : "focus:border-main"
          }`}
          onClick={() => !noSelected && setOpen((prev) => !prev)}
        >
          <span className="text-sm text-inputPlaceholder">
            {multiple
              ? selected.length
                ? selected.join(", ")
                : placeholder
              : selected || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* Dropdown */}
        {open && !noSelected && (
          <ul className="absolute text-start top-full left-0 w-full mt-2 bg-white border border-buttonGrey rounded-xl shadow-md max-h-60 overflow-y-auto z-20">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`p-3 cursor-pointer hover:bg-gray-100 transition text-sm ${
                  multiple
                    ? selected.includes(opt.value)
                      ? "bg-gray-100 font-medium"
                      : ""
                    : selected === opt.value
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                {opt.name}
              </li>
            ))}

            {!options.length && (
              <li className="p-3 text-sm text-gray-400">No options</li>
            )}
          </ul>
        )}

        {/* Hidden input to register value */}
        <input
          type="hidden"
          name={name}
          required={required}
          value={multiple ? selected.join(",") : selected || ""}
          {...register(name, validation)}
        />
      </div>

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </label>
  );
}
