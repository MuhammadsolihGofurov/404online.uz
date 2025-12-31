import React from "react";

const PartQuestionGroupItemSkeleton = () => {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2 w-full">
          {/* Savol turi va raqamlari qatori */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          {/* Title qatori */}
          <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-2">
        {/* Questions count qismi */}
        <div className="h-3 w-20 bg-gray-100 rounded"></div>
        {/* Add Question tugmasi joyi */}
        <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export default PartQuestionGroupItemSkeleton;
