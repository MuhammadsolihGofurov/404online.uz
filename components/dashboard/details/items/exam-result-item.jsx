import React from "react";
import { useIntl } from "react-intl";
import {
  User,
  Trophy,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash,
  MoreHorizontal,
  FileSearch,
  LogIn,
  LogOut,
  BookOpen,
  Headphones,
  PenTool,
  CheckSquare,
  LucideCircleQuestionMark,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { useRouter } from "next/router";
import { Dropdown, DropdownBtn } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useOffcanvas } from "@/context/offcanvas-context";

export default function ExamResultItem({ item, role }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();
  const { openOffcanvas } = useOffcanvas();

  const { id, student, overall_band_score, is_graded, submissions = [] } = item;

  // Writing submisson-ni topish va holatini aniqlash
  const writingTask = submissions.find((s) => s.content_type === "WRITING");
  const listeningTask = submissions.find((s) => s.content_type === "LISTENING");
  const readingTask = submissions.find((s) => s.content_type === "READING");
  const isWritingPending = writingTask?.status !== "GRADED";

  // Ball rangini aniqlash
  const getScoreStyle = (score) => {
    const s = parseFloat(score) || 0;
    if (s <= 2.5) return "bg-red-500 text-white";
    if (s <= 5.0) return "bg-orange-500 text-white";
    if (s <= 7.5) return "bg-blue-600 text-white";
    return "bg-green-600 text-white";
  };

  // Har bir bo'lim uchun ikonka
  const getSectionIcon = (type) => {
    switch (type) {
      case "LISTENING":
        return <Headphones size={12} className="text-blue-500" />;
      case "READING":
        return <BookOpen size={12} className="text-emerald-500" />;
      case "WRITING":
        return <PenTool size={12} className="text-purple-500" />;
      case "QUIZ":
        return <LucideCircleQuestionMark size={12} className="text-pink-500" />;
      default:
        return null;
    }
  };

  const handleCheckWriting = (i) => {
    const currentWritingSubmissionId = submissions?.find(
      (item) => item.content_type === "WRITING"
    )?.id;

    openOffcanvas(
      "examResultsOffcanvas",
      { submission_id: currentWritingSubmissionId, role },
      "right"
    );
  };

  const handleCheckReading = () => {
    const currentReadingSubmissionId = submissions?.find(
      (item) => item.content_type === "READING"
    )?.id;

    openOffcanvas(
      "examReadingResultsOffcanvas",
      { submission_id: currentReadingSubmissionId, role },
      "right"
    );
  };

  const handleCheckListening = () => {
    const currentListeningSubmissionId = submissions?.find(
      (item) => item.content_type === "LISTENING"
    )?.id;

    openOffcanvas(
      "examReadingResultsOffcanvas",
      { submission_id: currentListeningSubmissionId, role },
      "right"
    );
  };

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:border-blue-300">
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {is_graded ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
              <CheckCircle size={12} />{" "}
              {intl.formatMessage({ id: "Fully Graded" })}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              <Clock size={12} />{" "}
              {intl.formatMessage({ id: "Action Required" })}
            </span>
          )}
        </div>

        <Dropdown
          width="w-44"
          buttonContent={
            <MoreHorizontal
              size={20}
              className="text-gray-400 hover:text-gray-600"
            />
          }
        >
          <DropdownBtn
            title={isWritingPending ? "Check Writing" : "Writing result"}
            icon={
              <CheckSquare
                size={14}
                className={`${isWritingPending ? "text-orange-500" : ""}`}
              />
            }
            className={`${isWritingPending ? "text-orange-500" : ""}`}
            onClick={() => handleCheckWriting(id)}
          />

          {readingTask && (
            <DropdownBtn
              title="Reading result"
              icon={<BookOpen size={14} />}
              onClick={() => handleCheckReading()}
            />
          )}
          {listeningTask && (
            <DropdownBtn
              title="Listening result"
              icon={<Headphones size={14} />}
              onClick={() => handleCheckListening()}
            />
          )}
          {/* <DropdownBtn
            title="Delete Result"
            icon={<Trash size={14} className="text-red-500" />}
            className="text-red-500"
            onClick={() => {
            }}
          /> */}
        </Dropdown>
      </div>

      {/* --- Student Info --- */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden text-blue-600 font-bold">
            {student?.avatar ? (
              <img
                src={student?.avatar}
                alt=""
                title={student?.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              student?.full_name?.charAt(0)
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {student?.full_name}
            </h3>
            <p className="text-[11px] text-gray-400">{student?.email}</p>
          </div>
        </div>
      </div>

      {/* --- Submissions Scores Grid --- */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {submissions.map((sub) => {
          // Agar quiz bo'lsa natijani hisoblaymiz
          let displayScore = sub.band_score;

          if (sub.content_type === "QUIZ" && sub.user_answers) {
            const correct = sub.user_answers.filter((a) => a.is_correct).length;
            const total = sub.user_answers.length;
            displayScore = `${correct}/${total}`;
          }

          return (
            <div
              key={sub.id}
              className="flex flex-col min-h-11 items-center p-2 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="mb-1">{getSectionIcon(sub.content_type)}</div>
              <span className="text-[9px] uppercase font-bold text-gray-400">
                {sub.content_type}
              </span>
              <span
                className={`text-xs font-bold ${
                  sub.status === "PENDING" ? "text-orange-500" : "text-gray-700"
                }`}
              >
                {sub.status === "PENDING" ? "???" : displayScore}
              </span>
            </div>
          );
        })}
      </div>

      {/* --- Footer --- */}
      <div className="mt-auto pt-4 border-t border-dashed border-gray-200 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">
            Overall Band
          </span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg shadow-sm w-fit ${getScoreStyle(
              overall_band_score
            )}`}
          >
            <Trophy size={14} />
            <span className="text-lg font-black leading-none">
              {overall_band_score || "0.0"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] text-gray-400 font-medium">
            Finished at
          </span>
          <span className="text-xs font-bold text-gray-600 flex flex-col items-end">
            {submissions[0]?.finished_at ? (
              <>
                <span>{formatDate(submissions[0].finished_at)}</span>
                <span className="text-[10px] text-blue-500 font-medium leading-none mt-1">
                  {new Date(submissions[0].finished_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </>
            ) : (
              "---"
            )}
          </span>
        </div>
      </div>

      {/* Accent Line */}
      <div
        className={`absolute opacity-0 group-hover:opacity-100 transition-colors duration-150 top-0 left-0 w-full h-1.5 rounded-t-2xl ${
          isWritingPending ? "bg-orange-400" : "bg-blue-500"
        }`}
      />
    </div>
  );
}
