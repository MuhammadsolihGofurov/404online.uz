import React from "react";

export default function GroupListItemSkeleton() {
  return (
    <div className="rounded-xl bg-[#F7F6FA] overflow-hidden animate-pulse">
      {/* Top section */}
      <div className="bg-[#495e61] min-h-[72px] relative">
        <div className="w-14 h-14 rounded-full bg-slate-300 absolute -bottom-5 left-2/4 -translate-x-2/4"></div>
      </div>

      {/* Title */}
      <div className="px-3 pb-3 pt-7 text-center">
        <div className="w-24 h-4 bg-slate-300 rounded mx-auto"></div>
      </div>

      {/* Footer section */}
      <div className="w-full p-3 border-t border-t-gray-200 flex items-center justify-between">
        {/* Members */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-300 rounded"></div>
          <div className="h-4 w-6 bg-slate-300 rounded"></div>
        </div>

        {/* Dropdown button */}
        <div className="h-5 w-5 bg-slate-300 rounded"></div>
      </div>
    </div>
  );
}
