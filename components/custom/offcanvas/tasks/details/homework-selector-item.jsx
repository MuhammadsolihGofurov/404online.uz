import React, { useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import fetcher from "@/utils/fetcher";
import { useInView } from "react-intersection-observer";
import { ButtonSpinner } from "@/components/custom/loading";
import { useIntl } from "react-intl";
import {
  Search,
  Clock,
  FileText,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";

const HomeworkItemSelector = ({
  title,
  type,
  selectedItems,
  onToggle,
  locale,
  endpoint,
}) => {
  const intl = useIntl();
  const { ref, inView } = useInView();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchValue), 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.results.length) return null;
    // Status HOMEWORK mocklar uchun, quizlar uchun shart emas
    const statusParam = type === "quiz" ? "" : "&status=HOMEWORK";
    return `${endpoint}?page=${
      pageIndex + 1
    }&page_size=10${statusParam}&search=${debouncedSearch}`;
  };

  const { data, size, setSize, isValidating } = useSWRInfinite(
    (index, prev) => [getKey(index, prev), locale],
    ([url]) =>
      fetcher(url, { headers: { "Accept-Language": locale } }, {}, true)
  );

  const items = data ? data.flatMap((page) => page.results) : [];
  const isLoadingMore =
    isValidating || (size > 0 && data && typeof data[size - 1] === "undefined");
  const hasMore = data && data[data.length - 1]?.next !== null;

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) setSize(size + 1);
  }, [inView, hasMore, isLoadingMore]);

  useEffect(() => {
    setSize(1);
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Sarlavha va Search */}
      <div className="flex flex-col gap-2">
        <h3 className="text-left font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
          {type === "quiz" ? (
            <BrainCircuit size={18} className="text-main" />
          ) : (
            <FileText size={18} className="text-main" />
          )}
          {title}
        </h3>

        <div className="relative w-full">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={intl.formatMessage({ id: "Search" })}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-main focus:ring-2 focus:ring-main/10 transition-all placeholder:text-gray-400 bg-white"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* List qismi */}
      <div className="flex flex-col gap-2 h-[350px] overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50/50 scrollbar-thin">
        {items.length === 0 && !isValidating ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <FileText size={32} strokeWidth={1.5} />
            <span className="text-xs">
              {intl.formatMessage({ id: "No items found" })}
            </span>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedItems.some((i) => i.id === item.id);
            const orderIndex =
              selectedItems.findIndex((i) => i.id === item.id) + 1;

            return (
              <div
                key={item.id}
                onClick={() => onToggle(item, type)}
                className={`group flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-main bg-white shadow-md ring-1 ring-main"
                    : "bg-white border-gray-200 hover:border-main/50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`font-semibold text-sm transition-colors ${
                      isSelected ? "text-main" : "text-gray-700"
                    }`}
                  >
                    {item.title}
                  </span>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="bg-main text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                        #{orderIndex}
                      </span>
                    )}
                    {isSelected ? (
                      <CheckCircle2
                        size={20}
                        className="text-main"
                        fill="currentColor"
                        fillOpacity={0.1}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-main/30" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  {item.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={14} className="text-gray-400" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText size={14} className="text-gray-400" />
                    <span>
                      {item.questions_count || item?.content?.length || 0}{" "}
                      {intl.formatMessage({ id: "questions" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Scroll Trigger */}
        <div ref={ref} className="py-4 flex justify-center min-h-[50px]">
          {isLoadingMore ? (
            <ButtonSpinner size="small" />
          ) : !hasMore && items.length > 0 ? (
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider italic">
              {intl.formatMessage({ id: "All items loaded" })}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default HomeworkItemSelector;
