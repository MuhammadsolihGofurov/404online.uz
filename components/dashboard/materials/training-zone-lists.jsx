import Pagination from "@/components/custom/pagination";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useIntl } from "react-intl";
import { TemplateItemSkeleton } from "@/components/skeleton";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import { parseDurationToMinutes } from "@/utils/durationParser";

export default function TraniningZoneLists({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();

  const currentPage = findParams("page") || 1;
  const [activeType, setActiveType] = useState("LISTENING");

  const endpoint =
    activeType === "READING" ? "/mocks/reading/" : "/mocks/listening/";

  const { data: datas, isLoading } = useSWR(
    [endpoint, router.locale, currentPage, activeType],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}&page_size=12&status=PRACTICE&ordering=-created_at`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const mocks = useMemo(() => datas?.results || [], [datas]);

  if (loading || isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bg-white rounded-2xl p-5 sm:p-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <TemplateItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {[
            { key: "LISTENING", label: "Listening" },
            { key: "READING", label: "Reading" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveType(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeType === item.key
                  ? "bg-main text-white border-main"
                  : "border-gray-200 text-gray-600 hover:border-main hover:text-main"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {mocks.length > 0 ? (
            mocks.map((mock) => {
              const durationMinutes =
                Number.isFinite(mock?.duration)
                  ? mock.duration
                  : parseDurationToMinutes(mock?.duration);

              return (
                <div
                  key={mock.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                >
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                        PRACTICE
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100 uppercase tracking-wide">
                        {activeType}
                      </span>
                    </div>

                    <h3
                      className="text-base font-bold text-gray-900 mb-2 line-clamp-2"
                      title={mock.title}
                    >
                      {mock.title ||
                        intl.formatMessage({
                          id: "Untitled Practice",
                          defaultMessage: "Untitled Practice",
                        })}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {mock.description ||
                        intl.formatMessage({
                          id: "No description",
                          defaultMessage: "No description provided.",
                        })}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="flex items-center text-gray-500 bg-gray-50 rounded-lg p-2">
                        <Clock size={14} className="mr-2 text-blue-500" />
                        <span className="text-xs font-medium">
                          {durationMinutes || "-"}{" "}
                          {durationMinutes === 1 ? "min" : "mins"}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 bg-gray-50 rounded-lg p-2">
                        <BookOpen size={14} className="mr-2 text-emerald-500" />
                        <span className="text-xs font-medium">
                          Q: {mock?.questions_count ?? 0}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/practice/${activeType.toLowerCase()}/${mock.id}`
                        )
                      }
                      className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-main text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <PlayCircle size={16} />
                      {intl.formatMessage({
                        id: "Start Practice",
                        defaultMessage: "Start Practice",
                      })}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-center col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-textSecondary">
              {intl.formatMessage({ id: "There isn't anything" })}
            </p>
          )}
        </div>
      </div>

      <Pagination count={datas?.count} pageSize={12} />
    </>
  );
}
