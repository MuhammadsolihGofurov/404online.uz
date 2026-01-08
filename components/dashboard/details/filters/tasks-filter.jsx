import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";

export default function TasksFilter() {
  const { findParams, updateParams } = useParams();
  const intl = useIntl();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(router.query.search || "");

  useEffect(() => {
    setSearchValue(router.query.search || "");
  }, [router.query.search]);

  const queries = [
    { id: 1, title: "Homeworks", type: "homeworks" },
    { id: 2, title: "Exams", type: "exams" },
  ];

  const handleTabChange = (type) => {
    updateParams("type", type);
  };

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    updateParams("search", value);
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
            const currentQueryType = router.query.type;
            const isActive = currentQueryType == item.type;

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleTabChange(item.type)}
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

      {/* O'ng taraf: Search qismi */}
      <div className="relative w-full md:w-64 lg:w-80">
        <input
          type="text"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={intl.formatMessage({ id: "Search" })}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-main focus:ring-1 focus:ring-main/20 transition-all placeholder:text-gray-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
