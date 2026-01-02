import React, { useEffect } from "react";
import { X } from "lucide-react";

export const OffcanvasWrapper = ({
  children,
  onClose,
  isOpen,
  position = "right",
}) => {
  // Panel ochiqligida body scrollni to'xtatish
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const posClasses = {
    right: "right-0 h-full w-full max-w-3xl border-l animate-slideInRight",
    left: "left-0 h-full w-full max-w-3xl border-r animate-slideInLeft",
    bottom: "bottom-0 w-full h-[70vh] border-t animate-slideInUp",
  };

  return (
    <div className="fixed inset-0 z-[60] flex overflow-hidden">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Content Area */}
      <div
        className={`absolute bg-white shadow-2xl flex flex-col transition-transform duration-300 ${posClasses[position]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-textPrimary uppercase tracking-tight">
            Menyu
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
    </div>
  );
};
