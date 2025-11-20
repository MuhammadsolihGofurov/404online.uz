import React from "react";

export default function MockViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 space-y-4">
        <div className="h-10 w-3/4 bg-gray-300 rounded-full"></div>
        <div className="h-6 w-1/4 bg-gray-300 rounded-full mt-2"></div>
        <div className="flex gap-4 mt-4">
          <div className="h-4 w-1/5 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-1/5 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-1/5 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Sections Skeleton */}
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl p-5 space-y-4">
          <div className="h-6 w-1/3 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-full bg-gray-200 rounded-md"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded-md"></div>
          <div className="h-40 w-full bg-gray-300 rounded-xl"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded-md"></div>
        </div>
      ))}
    </div>
  );
}
