import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import { useIntl } from "react-intl";
import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";

export default function ExamResultsOffcanvas({ submission_id }) {
  const router = useRouter();
  const intl = useIntl();
  const { openModal } = useModal();
  const { closeOffcanvas } = useOffcanvas();

  const { data, isLoading } = useSWR(
    submission_id ? ["/submissions", router.locale, submission_id] : null,
    ([url, locale, subId]) =>
      fetcher(
        `${url}/${subId}/`,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-400 animate-pulse font-medium">
        Loading submission...
      </div>
    );
  if (!data) return null;

  const tasks = data.writing_mock?.tasks || [];
  const userAnswers = data.user_answers || [];

  const handleGrade = () => {
    openModal("gradingWritingModal", { submission_id }, "big");

    closeOffcanvas("examResultsOffcanvas");
  };

  return (
    <div className="bg-[#fcfcfc] min-h-full font-sans pb-20">
      {/* Top Profile Header */}
      <div className="sm:px-10 py-8 sm:py-12 border-b border-slate-100 bg-white">
        <span className="text-[10px] sm:text-xs font-bold text-main uppercase tracking-[0.2em] mb-2 block text-center sm:text-left">
          Student Assessment
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight text-center sm:text-left">
          {data.user?.full_name}
        </h2>
        <p className="text-slate-400 mt-2 sm:mt-4 text-xs sm:text-sm font-medium text-center sm:text-left">
          {data.content_title}
        </p>
      </div>

      <div className="sm:px-10 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {tasks.map((task) => {
          const answer = userAnswers.find((a) => a.question_id === task.id);
          const rawText = answer?.answer_value || "";
          const wordCount =
            rawText.trim() === "" ? 0 : rawText.trim().split(/\s+/).length;
          const isUnderLimit = wordCount < task.min_words;

          return (
            <div key={task.id} className="max-w-4xl mx-auto">
              {/* Task Title & Stats */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                    {task.task_number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight italic uppercase">
                    Task {task.task_number}
                  </h3>
                </div>
                <div className="w-full sm:w-auto px-6 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                  <span
                    className={`text-xl sm:text-2xl font-mono font-black ${
                      isUnderLimit ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {wordCount}
                  </span>
                  <span className="text-[10px] block font-bold text-slate-400 uppercase leading-none mt-1">
                    Total Words
                  </span>
                </div>
              </div>

              {/* Question Box */}
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-slate-200"></div>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-3 sm:mb-4">
                  Question Prompt
                </span>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed italic pr-2 sm:pr-4">
                  "{task.prompt}"
                </p>
                {task.image && (
                  <div className="mt-6 sm:mt-8">
                    <img
                      src={task.image}
                      alt="Task"
                      className="rounded-xl sm:rounded-2xl border border-slate-100 max-h-[250px] sm:max-h-[300px] w-full object-contain shadow-sm bg-slate-50"
                    />
                  </div>
                )}
              </div>

              {/* Student Paper (DAFTAR USLUBI) */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Student's Essay
                  </span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                {/* Notebook Effect Container */}
                <div className="relative py-6 px-1 sm:p-10 bg-white rounded-lg shadow-inner border border-slate-100 overflow-hidden">
                  <div className="text-sm sm:text-[18px] text-slate-800 leading-7 whitespace-pre-wrap pl-3 sm:pl-4 relative z-10">
                    {rawText || "The student has not provided a response."}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Grade Button - Fixed on Mobile or at the bottom */}
      <div className="fixed sm:relative bottom-0 left-0 w-full p-4 sm:p-0 sm:mt-10 bg-white sm:bg-transparent border-t sm:border-t-0 z-20">
        <button
          type="submit"
          className="w-full sm:w-auto sm:float-right bg-main text-white px-10 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg sm:shadow-none"
          onClick={() => handleGrade()}
        >
          Grade writing tasks
        </button>
      </div>
    </div>
  );
}
