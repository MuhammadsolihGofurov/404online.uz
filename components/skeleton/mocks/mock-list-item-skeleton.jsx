import React from "react";

export default function MockListItemSkeleton() {
  return (
    <div className="w-full rounded-xl bg-white border border-gray-100 shadow-sm animate-pulse overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-indigo-400/50 to-indigo-500/50 border-b border-indigo-600/20">
        <div className="h-4 w-16 bg-white/40 rounded-full mb-3"></div>
        <div className="h-4 w-32 bg-white/60 rounded mb-2"></div>
        <div className="h-3 w-20 bg-white/30 rounded"></div>
      </div>

      {/* Info Grid */}
      <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="h-3 w-24 bg-gray-200 rounded"></div>
        <div className="h-3 w-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
