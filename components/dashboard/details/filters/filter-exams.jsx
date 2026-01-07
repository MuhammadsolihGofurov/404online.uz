import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";

export default function FilterExams() {
  const { updateParams } = useParams();
  const intl = useIntl();
  const router = useRouter();

  const queries = [
    { id: 1, title: "Graded", is_graded: "graded" },
    { id: 2, title: "Not graded", is_graded: "not_graded" },
  ];

  const handleTabChange = (type) => {
    updateParams("is_graded", type);
  };

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Chap taraf: Filtrlar */}
      <div className="flex flex-row items-center gap-5">
        <p className="text-textPrimary text-sm font-semibold whitespace-nowrap">
          {intl.formatMessage({ id: "Filters" })}:
        </p>
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {queries.map((item) => {
            const currentQueryType = router.query.is_graded;
            const isActive = currentQueryType == item.is_graded;

            return (
              <button
                key={item.is_graded}
                type="button"
                onClick={() => handleTabChange(item.is_graded)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-xl border text-xs sm:text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-main text-white border-main"
                    : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
