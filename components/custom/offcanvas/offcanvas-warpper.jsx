import React, { useEffect } from "react";
import { X } from "lucide-react";

export const OffcanvasWrapper = ({
  children,
  onClose,
  isOpen,
  position = "right",
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const posStyles = {
    right: {
      base: "right-0 top-0 h-full w-full max-w-5xl border-l",
      closed: "translate-x-full",
      open: "translate-x-0",
    },
    left: {
      base: "left-0 top-0 h-full w-full max-w-5xl border-r",
      closed: "-translate-x-full",
      open: "translate-x-0",
    },
    bottom: {
      base: "bottom-0 left-0 w-full h-[70vh] border-t",
      closed: "translate-y-full",
      open: "translate-y-0",
    },
  };

  const currentPos = posStyles[position];

  return (
    <>
      <div
        className={`fixed inset-0 z-[40] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed z-[50] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out will-change-transform ${
          currentPos.base
        } ${isOpen ? currentPos.open : currentPos.closed}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-textPrimary uppercase tracking-tight">
            MENU
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
};
