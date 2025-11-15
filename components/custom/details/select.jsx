import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useIntl } from "react-intl";

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
  onChange = () => {},
  value = multiple ? [] : null,
  onBlur = () => {},
}) {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  const handleSelect = (newValue) => {
    let updatedValue;

    if (multiple) {
      updatedValue = value.includes(newValue)
        ? value.filter((v) => v !== newValue)
        : [...value, newValue];
    } else {
      updatedValue = newValue;
      setOpen(false);
    }

    onChange(updatedValue);
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
              ? value.length
                ? value.join(", ")
                : placeholder
              : value || placeholder}
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
                    ? value.includes(opt.value)
                      ? "bg-gray-100 font-medium"
                      : ""
                    : value === opt.value
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                {intl.formatMessage({ id: opt.name })}
              </li>
            ))}

            {!options.length && (
              <li className="p-3 text-sm text-gray-400">No options</li>
            )}
          </ul>
        )}

        {/* Hidden input to register value */}
        {/* <input
          className="opacity-0 invisible absolute"
          name={name}
          required={required} // Agar Controller ishlatilsa, register va value kerak emas!
        /> */}
      </div>

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </label>
  );
}
