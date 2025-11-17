import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react"; // <-- Check qo‘shildi
import { useIntl } from "react-intl";

export default function SingleSelect({
  title,
  placeholder = "Select...",
  options = [],
  value = null,
  onChange = () => {},
  error,
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => (o.value ?? o.id) === value);

  const handleSelect = (newValue) => {
    onChange(newValue);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full relative">
      {title && (
        <span className="text-textSecondary font-semibold text-sm">
          {title}
        </span>
      )}

      <div
        className={`rounded-xl p-4 w-full border border-buttonGrey cursor-pointer flex justify-between items-center ${
          error ? "border-red-500" : "focus:border-main"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm text-inputPlaceholder">
          {selectedOption
            ? selectedOption.full_name || selectedOption.name || value
            : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <ul className="absolute top-full left-0 text-start w-full mt-2 bg-white border border-buttonGrey rounded-xl shadow-md max-h-48 overflow-y-auto z-20">
          {options.length > 0 ? (
            options.map((opt) => {
              const valueOpt = opt.value ?? opt.id;
              const isSelected = value === valueOpt;

              return (
                <li
                  key={valueOpt}
                  onClick={() => handleSelect(valueOpt)}
                  className={`p-3 cursor-pointer hover:bg-gray-100 transition text-sm flex items-center justify-between ${
                    isSelected ? "font-medium" : ""
                  }`}
                >
                  {/* Left side label */}
                  {opt.full_name || opt.name}

                  {/* Right side check icon */}
                  {isSelected && <Check className="h-4 w-4 text-green-500" />}
                </li>
              );
            })
          ) : (
            <li className="p-3 text-sm text-gray-400">No options</li>
          )}
        </ul>
      )}

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
}
