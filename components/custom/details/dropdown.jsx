import React, { useState, useRef, useEffect } from "react";

export default function Dropdown({ children, buttonContent, width = "w-32" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        {buttonContent}
      </button>

      {open && (
        <div
          className={`fixed z-[11] bg-white shadow-lg border border-gray-100 rounded-xl py-2 ${width}`}
          style={{
            top: menuRef.current?.getBoundingClientRect().bottom + 4,
            left: menuRef.current?.getBoundingClientRect().right - 128,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
