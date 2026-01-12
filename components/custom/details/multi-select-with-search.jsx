import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { ChevronDown, Check, Search } from "lucide-react"; // Search icon qo'shildi
import { useIntl } from "react-intl";

const MultiSelectWithSearch = forwardRef(function MultiSelect(
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
  const [searchTerm, setSearchTerm] = useState(""); // Qidiruv uchun state
  const intl = useIntl();

  const wrapperRef = useRef(null);

  // Tashqariga bosilganda yopish va qidiruvni tozalash
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setSearchTerm(""); // Yopilganda qidiruv matnini o'chirish
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrlash mantiqi
  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      const label = (
        opt.full_name ||
        opt.name ||
        opt?.title ||
        ""
      ).toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm]);

  const handleSelect = (opt) => {
    const exists = value.some((v) => v.id === opt.id);
    const updatedValue = exists
      ? value.filter((v) => v.id !== opt.id)
      : [...value, opt];

    onChange(updatedValue);
  };

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col gap-2 w-full relative text-start"
    >
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
        <span className="text-sm text-inputPlaceholder flex-1 line-clamp-1">
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
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-buttonGrey rounded-xl shadow-md z-20 flex flex-col overflow-hidden">
          {/* Qidiruv inputi */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              autoFocus
              className="w-full text-sm bg-transparent outline-none p-1"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Inputga bosganda dropdown yopilib ketmasligi uchun
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
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
              <div className="p-3 text-sm text-gray-400 text-center">
                Ma'lumot topilmadi
              </div>
            )}
          </div>
        </div>
      )}

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
});

export default MultiSelectWithSearch;
