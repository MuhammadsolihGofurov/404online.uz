import React from "react";

export default function SidebarLinksSkeleton({ itemsCount = 5 }) {
  return (
    <nav className="flex-1 p-4 space-y-2">
      {Array.from({ length: itemsCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2 animate-pulse"
        >
          {/* To‘rtburchak ikonka o‘rnida */}
          <div className="w-5 h-5 bg-gray-300 rounded-md" />

          {/* Text o‘rnida */}
          <div className="h-4 bg-gray-300 rounded w-3/4" />
        </div>
      ))}
    </nav>
  );
}
