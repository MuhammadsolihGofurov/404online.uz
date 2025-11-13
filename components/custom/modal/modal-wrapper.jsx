import React from "react";

export const ModalWrapper = ({ children, onClose, size = "big" }) => {
  const modalSizeClass =
    size === "big" ? "max-w-3xl w-full" : "max-w-sm w-full";

  return (
    <div
      className="
        fixed inset-0 z-50 bg-black/50 overflow-y-auto
        flex justify-center
        py-10
      "
      onClick={onClose}
    >
      <div
        className={`
          bg-white rounded-2xl relative shadow-lg
          ${modalSizeClass}
          w-full mx-4
          p-6 sm:p-8
          my-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
};
