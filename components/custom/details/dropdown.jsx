import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";

export default function Dropdown({
  children,
  type = "",
  buttonContent,
  width = "w-32",
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const intl = useIntl();

  // Tashqariga bosilganda menyuni yopish
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      setOpen(false); // scroll bo'lganda dropdown yopiladi
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true => capture phase, har qanday scrollni tutadi

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div className={`relative inline-block`} ref={menuRef}>
      <div
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={` hover:bg-gray-100 rounded-lg cursor-pointer ${
          type === "filter"
            ? "border border-b-gray-200 text-sm text-gray-500 flex items-center justify-center gap-2 px-5 py-2 w-[132px] "
            : "p-2"
        }`}
      >
        {type === "filter" ? (
          <>
            <span>{intl.formatMessage({ id: buttonContent })}</span>
            <ChevronDown className="w-3 h-3" />
          </>
        ) : (
          buttonContent
        )}
      </div>

      {open && (
        <div
          className={`fixed z-[11] bg-white shadow-lg border border-gray-100 rounded-xl py-2 ${width}`}
          style={{
            top: menuRef.current?.getBoundingClientRect().bottom + 4,
            left: menuRef.current?.getBoundingClientRect().right - 128,
          }}
          onClick={() => setOpen((prev) => !prev)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
