// ChatsLeftGroupsSkeleton.jsx
import React from "react";

export default function ChatsLeftGroupsSkeleton({ count = 5 }) {
  return (
    <div className="col-span-2 h-full p-3 w-full">
      {/* Header */}
      <div className="h-5 w-20 bg-gray-200 rounded mb-3 animate-pulse" />

      {/* Skeleton items */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 animate-pulse"
          >
            {/* Circle avatar */}
            <div className="w-5 h-5 rounded-full bg-gray-300" />
            {/* Text line */}
            <div className="h-3 w-24 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
