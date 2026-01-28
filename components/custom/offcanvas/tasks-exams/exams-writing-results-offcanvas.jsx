import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import { useIntl } from "react-intl";
import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";

export default function ExamResultsOffcanvas({ submission_id, role }) {
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
        true,
      ),
  );

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-400 animate-pulse font-medium">
        Loading...
      </div>
    );
  if (!data) return null;

  const tasks = data.mock?.tasks || [];
  const userAnswers = data.user_answers || [];
  const review = data.review;

  const handleGrade = () => {
    openModal(
      "gradingWritingModal",
      {
        submission_id,
        initialData: {
          ...review?.rubric_data,
          id: review?.id,
          feedback_text: review?.feedback_text,
        },
      },
      "big",
    );
    closeOffcanvas("examResultsOffcanvas");
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* Top Header */}
      <div className="px-5 sm:px-10 py-8 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black text-main uppercase tracking-widest mb-1 block">
              Assessment Report
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              {data.user?.full_name}
            </h2>
            <p className="text-slate-500 text-xs mt-1">{data.content_title}</p>
          </div>
          {review && (
            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl">
              <span className="text-[10px] font-bold uppercase opacity-70">
                Band Score:
              </span>
              <span className="text-2xl font-black">{review.band_score}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-10 space-y-12">
        {/* --- COMPACT REVIEW SECTION --- */}
        {review && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-main rounded-full"></div>
                <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">
                  Detailed Evaluation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(review.rubric_data || {}).map(
                  ([key, value]) => {
                    if (key == "notes") {
                      return null;
                    }

                    if (key == "feedback_text") {
                      return null;
                    }

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                      >
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-lg font-black text-slate-900 border border-slate-100">
                          {value}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {review.feedback_text && (
                <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                      Instructor's Notes
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                    "{review.feedback_text}"
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* --- TASKS SECTION --- */}
        <div className="space-y-16">
          {tasks.map((task) => {
            const answer = userAnswers.find((a) => a.question_id === task.id);
            const rawText = answer?.answer_value || "";
            const wordCount =
              rawText.trim() === "" ? 0 : rawText.trim().split(/\s+/).length;

            return (
              <div key={task.id} className="group">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-main font-black text-xs uppercase tracking-[0.2em]">
                      Task {task.task_number}
                    </span>
                    <h4 className="text-lg font-bold text-slate-800 mt-1">
                      Student Writing Response
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">
                      Word Count
                    </div>
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-700">
                      {wordCount}{" "}
                      <span className="text-slate-300 font-normal">
                        / {task.min_words}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all group-hover:shadow-md">
                  {/* Prompt */}
                  <div className="p-6 bg-slate-50 border-b border-slate-100 text-slate-600 text-sm leading-relaxed italic break-words">
                    <div dangerouslySetInnerHTML={{ __html: task?.prompt }} />
                  </div>

                  {/* Essay Content */}
                  <div className="p-8 sm:p-10">
                    <div className="text-[17px] leading-[1.8] text-slate-800 font-serif whitespace-pre-wrap break-words">
                      {rawText || (
                        <span className="text-slate-300 italic">
                          No response submitted.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      {role !== "STUDENT" && (
        <div className="w-full flex items-center justify-end">
          <button
            type="button"
            className="w-full sm:w-auto bg-main text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest"
            onClick={handleGrade}
          >
            {review ? "Update Grade" : "Grade Submission"}
          </button>
        </div>
      )}
    </div>
  );
}
