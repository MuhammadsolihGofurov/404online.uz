import React from "react";

export default function EduCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full animate-pulse">
      {[1, 2, 3].map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col items-start gap-4 bg-white rounded-2xl px-3 sm:px-7 py-4 sm:py-5 w-full"
        >
          {/* Card Title */}
          <div className="h-6 w-1/3 bg-gray-200 rounded-md" />

          {/* Items */}
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3].map((__, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 " />

                {/* Text */}
                <div className="flex flex-col gap-1 w-full flex-1">
                  <div className="h-4 w-2/3 bg-gray-200 rounded-md" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* View All Link */}
          <div className="h-4 w-1/4 bg-gray-200 rounded-md mt-4 self-end" />
        </div>
      ))}
    </div>
  );
}
