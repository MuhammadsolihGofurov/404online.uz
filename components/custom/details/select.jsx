import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = forwardRef(function Select(
  {
    title,
    placeholder = "Select...",
    options = [],
    value = null,
    onChange = () => {},
    error,
  },
  ref
) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedOption = options.find((o) => (o.value ?? o.id) === value);

  const handleSelect = (newValue) => {
    onChange(newValue);
    setOpen(false);
  };

  // CLICK OUTSIDE CLOSE
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col items-start gap-2 w-full relative"
    >
      {title && (
        <span className="text-textSecondary font-semibold text-sm">
          {title}
        </span>
      )}

      <div
        ref={ref} 
        className={`rounded-xl p-4 h-[57.6px] w-full border border-buttonGrey cursor-pointer flex justify-between items-center ${
          error ? "border-red-500" : "focus:border-main"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`text-sm ${selectedOption ? 'text-gray-900' : 'text-inputPlaceholder'}`}>
          {selectedOption
            ? selectedOption.label || selectedOption.full_name || selectedOption.name || value
            : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-buttonGrey rounded-xl shadow-md max-h-48 overflow-y-auto z-20 text-start">
          {options.length > 0 ? (
            options.map((opt) => {
              const optValue = opt?.value ?? opt?.id;
              const isSelected = value === optValue;

              return (
                <li
                  key={optValue}
                  onClick={() => handleSelect(optValue)}
                  className={`p-3 cursor-pointer hover:bg-gray-100 transition text-sm flex items-center justify-between text-gray-900 ${
                    isSelected ? "font-medium bg-gray-50" : ""
                  }`}
                >
                  {opt?.label || opt?.full_name || opt?.name}
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
});

export default Select;
