import React from "react";
import {
  Calendar,
  Award,
  Target,
  BookOpen,
  PenTool,
  MessageSquare,
  ChevronRight,
  Layers,
  Clock,
  Headphones,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import { Dropdown, DropdownBtn } from "@/components/custom/details";
import { useOffcanvas } from "@/context/offcanvas-context";

const MyResultItem = ({ data, role }) => {
  const { openOffcanvas } = useOffcanvas();

  // Rubric ma'lumotlarini array ko'rinishiga keltiramiz
  const rubrics = [
    {
      label: "Task Achievement",
      score: data?.rubric_data?.task_achievement,
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Cohesion & Coherence",
      score: data?.rubric_data?.coherence_cohesion,
      icon: Layers,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Lexical Resource",
      score: data?.rubric_data?.lexical_resource,
      icon: BookOpen,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Grammar Accuracy",
      score: data?.rubric_data?.grammatical_range,
      icon: PenTool,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  // Sanani formatlash (8-yanvar, 2026)
  const formattedDate = new Date(data?.started_at).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Vaqtni formatlash (15:03)
  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      default:
        return null;
    }
  };

  const handleCheckWriting = (i) => {
    const currentWritingSubmissionId = data?.submissions?.find(
      (item) => item.content_type === "WRITING"
    )?.id;

    openOffcanvas(
      "examResultsOffcanvas",
      { submission_id: currentWritingSubmissionId, role },
      "right"
    );
  };

  const handleCheckReading = () => {
    const currentReadingSubmissionId = data?.submissions?.find(
      (item) => item.content_type === "READING"
    )?.id;

    openOffcanvas(
      "examReadingResultsOffcanvas",
      { submission_id: currentReadingSubmissionId, role },
      "right"
    );
  };

  const handleCheckListening = () => {
    const currentListeningSubmissionId = data?.submissions?.find(
      (item) => item.content_type === "LISTENING"
    )?.id;

    openOffcanvas(
      "examReadingResultsOffcanvas",
      { submission_id: currentListeningSubmissionId, role },
      "right"
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Yuqori qism: Sarlavha va Umumiy Band Score */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-50">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-lg sm:text-xl leading-tight">
              {data?.content_title}
            </h3>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-slate-400 text-xs font-medium">
              {/* Sana */}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-300" />
                <span>{formattedDate}</span>
              </div>

              {/* Vaqt oralig'i */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <Clock size={14} className="text-slate-300" />
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">
                    {formatTime(data?.started_at)}
                  </span>
                  <span className="text-slate-300">—</span>
                  <span className="text-slate-500">
                    {formatTime(data?.completed_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {data?.overall_band_score ? (
              <div className="flex flex-col items-center justify-center bg-main text-white rounded-2xl p-3 min-h-[62px] min-w-[80px] shadow-lg shadow-main/20">
                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80 leading-none mb-1">
                  Band Score
                </span>
                <span className="text-2xl font-black leading-none">
                  {data?.overall_band_score}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-400 rounded-2xl p-3 min-h-[62px] min-w-[80px] border border-slate-200 border-dashed">
                <span className="text-[10px] uppercase font-bold tracking-tighter leading-none mb-1">
                  Status
                </span>
                <span className="text-xs font-black uppercase leading-none">
                  Not Graded
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* title */}
      <div className="px-6 pt-5 text-textPrimary font-semibold">
        <h2>{data?.exam_task_title || data?.home_task_title}</h2>
      </div>

      {/* Markaziy qism: Rubrikalar ballari */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {data?.submissions?.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-col min-h-16 items-center p-2 bg-gray-50 rounded-xl border border-gray-100"
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
                {sub.status === "PENDING" ? "???" : sub.band_score}
              </span>
            </div>
          ))}
        </div>

        {/* buttons */}
        <div className="flex items-center justify-end">
          <Dropdown
            width="w-44"
            buttonContent={<span className="text-sm">View details</span>}
          >
            <DropdownBtn
              title={"Writing result"}
              icon={<CheckSquare size={14} className={``} />}
              onClick={() => handleCheckWriting()}
            />

            <DropdownBtn
              title="Reading result"
              icon={<BookOpen size={14} />}
              onClick={() => handleCheckReading()}
            />
            <DropdownBtn
              title="Listening result"
              icon={<Headphones size={14} />}
              onClick={() => handleCheckListening()}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default MyResultItem;
