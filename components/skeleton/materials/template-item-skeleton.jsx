import React from "react";

export default function TemplateItemSkeleton() {
  return (
    <div className="animate-pulse group bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header / Visual Section */}
      <div className="h-32 w-full relative bg-gray-200 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full shadow-sm" />
        <div className="absolute top-4 left-4 w-16 h-5 bg-gray-300 rounded-md" />
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2" />
        {/* Description */}
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center bg-gray-100 p-2 rounded-lg">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2" />
            <div className="flex flex-col w-16">
              <div className="h-2 bg-gray-300 rounded mb-1" />
              <div className="h-3 bg-gray-300 rounded w-8" />
            </div>
          </div>
          <div className="flex items-center bg-gray-100 p-2 rounded-lg">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2" />
            <div className="flex flex-col w-16">
              <div className="h-2 bg-gray-300 rounded mb-1" />
              <div className="h-3 bg-gray-300 rounded w-8" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-300 rounded" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
