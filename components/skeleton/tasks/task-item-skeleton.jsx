import React from "react";

export default function TaskItemSkeleton() {
  return (
    <div className="relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 overflow-hidden">
      {/* Animatsiya effekti uchun miltillovchi qatlam */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent" />

      {/* --- Header Skeleton --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {/* Type Badge Skeleton */}
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          {/* Status/Draft Badge Skeleton */}
          <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
        </div>
        {/* Menu Icon Skeleton */}
        <div className="h-5 w-5 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* --- Body Skeleton --- */}
      <div className="mb-6 space-y-3">
        {/* Title Lines */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Meta Info Rows */}
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-100 rounded-full animate-pulse" />
              <div
                className={`h-3 bg-gray-100 rounded animate-pulse ${
                  i === 1 ? "w-32" : i === 2 ? "w-40" : "w-24"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- Footer Skeleton --- */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="space-y-1.5">
          {/* "Created by" label */}
          <div className="h-2 w-12 bg-gray-100 rounded animate-pulse" />
          {/* Name */}
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Date */}
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse align-bottom" />
      </div>

      {/* Top Decoration Line Skeleton */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100" />
    </div>
  );
}
