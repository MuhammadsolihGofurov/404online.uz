import React from "react";

export default function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 w-full animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-white rounded-2xl px-3 sm:px-4 py-4 sm:py-5 w-full"
        >
          {/* Icon placeholder */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-100" />

          {/* Text placeholders */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
