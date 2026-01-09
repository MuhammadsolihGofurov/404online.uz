import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AwardIcon,
  BookOpenIcon,
} from "lucide-react"; // Ikonkalar uchun

export default function ExamResultsReview({ submission_id }) {
  const router = useRouter();

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
      <div className="p-20 text-center animate-pulse text-slate-400">
        Loading results...
      </div>
    );
  if (!data) return null;

  // Ma'lumotlarni qisqartma qilib olamiz
  const {
    user,
    mock,
    user_answers,
    score,
    band_score,
    used_duration,
    status,
    type,
    started_at,
    finished_at,
  } = data;

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.floor((endTime - startTime) / 1000);
  };

  // Davomiylikni hisoblaymiz
  const totalSeconds = calculateDuration(started_at, finished_at);

  const formatDuration = (seconds) => {
    if (seconds < 0) return "0m 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. HEADER SECTION - Score Summary */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    type === "EXAM"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {type} Result
                </span>
                <span className="text-slate-400 text-sm italic">
                  Attempt #{data.attempt_number}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                {mock?.title || data.content_title}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  {user?.full_name}
                </span>
                <span>•</span>
                {new Date(data.finished_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="bg-main text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-main/20 flex-1 md:flex-none min-w-[140px]">
                <div className="bg-white/20 p-2 rounded-lg">
                  <AwardIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-80 font-bold">
                    Band Score
                  </p>
                  <p className="text-2xl font-black">{band_score || "N/A"}</p>
                </div>
              </div>

              <div className="bg-white border p-4 rounded-2xl flex items-center gap-4 flex-1 md:flex-none min-w-[140px]">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                  <ClockIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">
                    Time Used
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatDuration(totalSeconds)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. MAIN TABLE - Answers Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpenIcon size={18} className="text-main" />
                Detailed Answer Review
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4"># No</th>
                    <th className="px-6 py-4">Your Answer</th>
                    <th className="px-6 py-4">Correct Answer</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {user_answers.map((ans, index) => {
                    // correct_answer ma'lumotini mock ichidan qidirib topish (agar user_answer ichida kelmasa)
                    const rawCorrect = ans?.correct_answer;

                    // Massiv bo'lsa join qiladi, aks holda o'zini oladi, agar yo'q bo'lsa "N/A"
                    const correctAnswer = Array.isArray(ans?.correct_answer)
                      ? rawCorrect.length > 0
                        ? rawCorrect.join(" / ")
                        : "N/A"
                      : rawCorrect || "N/A";

                    const userAnswer = Array.isArray(ans.answer_value)
                      ? ans.answer_value.length > 0
                        ? ans.answer_value.join(", ")
                        : "No answer"
                      : ans.answer_value || "No answer";

                    return (
                      <tr
                        key={ans.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td
                          className={`px-6 py-4 font-medium ${
                            ans.is_correct ? "text-slate-700" : "text-red-600"
                          }`}
                        >
                          {userAnswer || (
                            <span className="text-slate-300 italic">
                              No answer
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">
                          {correctAnswer}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ans.is_correct ? (
                            <CheckCircleIcon
                              className="text-emerald-500 mx-auto"
                              size={20}
                            />
                          ) : (
                            <XCircleIcon
                              className="text-red-400 mx-auto"
                              size={20}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. SIDEBAR - Statistics & Transcript */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">
              Performance Stats
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-slate-500">Correct Answers</span>
                <span className="text-lg font-bold text-emerald-500">
                  {user_answers.filter((a) => a.is_correct).length} /{" "}
                  {user_answers.length}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${
                      (user_answers.filter((a) => a.is_correct).length /
                        user_answers.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  * Band score is calculated based on the number of correct
                  answers for this specific test type.
                </p>
              </div>
            </div>
          </div>

          {/* Audio player if listening */}
          {mock?.audio_file && (
            <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white">
              <h4 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-slate-400">
                Test Audio
              </h4>
              <audio controls className="w-full h-8">
                <source src={mock.audio_file} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
