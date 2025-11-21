import React, { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useIntl } from "react-intl";

const MultiSelect = forwardRef(function MultiSelect(
  {
    title,
    placeholder = "Select...",
    options = [],
    value = [],
    onChange = () => {},
    error,
  },
  ref
) {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  // Wrapper reference
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    const exists = value.some((v) => v.id === opt.id);

    const updatedValue = exists
      ? value.filter((v) => v.id !== opt.id)
      : [...value, opt];

    onChange(updatedValue);
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2 w-full relative text-start">
      {title && (
        <span className="text-textSecondary font-semibold text-sm">
          {title}
        </span>
      )}

      <div
        ref={ref}
        className={`rounded-xl p-4 w-full border border-buttonGrey cursor-pointer flex justify-between items-center ${
          error ? "border-red-500" : "focus:border-main"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm text-inputPlaceholder flex-1">
          {value.length > 0
            ? value.map((v) => v.full_name || v.name || v?.title).join(", ")
            : placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-buttonGrey rounded-xl shadow-md max-h-48 overflow-y-auto z-20">
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = value.some((v) => v.id === opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`p-3 cursor-pointer text-start w-full hover:bg-gray-100 transition text-sm flex justify-between items-center ${
                    isSelected ? "font-medium" : ""
                  }`}
                >
                  <span className="flex-1">
                    {opt.full_name || opt?.name || opt?.title}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-green-500" />}
                </button>
              );
            })
          ) : (
            <button type="button" className="p-3 text-sm text-gray-400">
              No options
            </button>
          )}
        </div>
      )}

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
});

export default MultiSelect;
