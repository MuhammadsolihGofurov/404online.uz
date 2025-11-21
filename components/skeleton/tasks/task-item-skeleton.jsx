import React from "react";

export default function TaskItemSkeleton() {
  return (
    <div className="animate-pulse flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-12 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>

      {/* Title */}
      <div className="mb-6 space-y-2">
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="h-5 w-1/2 bg-gray-200 rounded" />
      </div>

      {/* Meta info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-8 bg-gray-200 rounded" />
          <div className="h-3 w-10 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
