import React from "react";

export default function DocumentItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-0 animate-pulse overflow-hidden flex flex-col h-full">
      {/* Preview skeleton */}
      <div className="h-40 w-full bg-gray-200" />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>

        {/* File type */}
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>

        {/* Date */}
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
          {/* Created by user */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
