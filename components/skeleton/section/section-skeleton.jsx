import React from "react";

const SectionSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 w-full animate-pulse">
      {/* Tepki qismi: Status va Arrow o'rni */}
      <div className="flex justify-between items-center mb-5">
        <div className="h-6 w-16 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 rounded-full bg-gray-100"></div>
      </div>

      {/* Sarlavha o'rni (2 qatorli) */}
      <div className="h-12 mb-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
      </div>

      {/* Info qismi o'rni (Grid) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
        <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
      </div>

      {/* Pastki qism o'rni */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="h-3 bg-gray-100 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-10"></div>
      </div>
    </div>
  );
};

export default SectionSkeleton;