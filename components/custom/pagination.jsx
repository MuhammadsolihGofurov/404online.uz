import React from "react";
import { usePagination } from "@/hooks/usePagination";

export default function Pagination({ count, pageSize = 10 }) {
  const { currentPage, totalPages, goToPage, nextPage, prevPage, pagesArray } =
    usePagination(count, pageSize);

  if (totalPages < 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 justify-center mt-4">
      <button
        onClick={() => goToPage(1)}
        className={`w-10 h-10 rounded-lg border ${
          currentPage === 1 ? "bg-main text-white" : "hover:bg-gray-100"
        }`}
      >
        1
      </button>

      {pagesArray().map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="px-2">
            ...
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => goToPage(p)}
            className={`w-10 h-10 rounded-lg border ${
              currentPage === p ? "bg-main text-white" : "hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      {totalPages > 1 && (
        <button
          onClick={() => goToPage(totalPages)}
          className={`w-10 h-10 rounded-lg border ${
            currentPage === totalPages
              ? "bg-main text-white"
              : "hover:bg-gray-100"
          }`}
        >
          {totalPages}
        </button>
      )}

    </div>
  );
}
