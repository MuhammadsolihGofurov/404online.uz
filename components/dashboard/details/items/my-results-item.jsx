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
} from "lucide-react";

const MyResultItem = ({ data }) => {
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

  const formattedDate = new Date(data?.reviewed_at).toLocaleDateString(
    "uz-UZ",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Yuqori qism: Sarlavha va Umumiy Band Score */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-50">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">
              {data?.content_title}
            </h3>
            <div className="flex items-center text-gray-400 text-xs gap-1">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-main text-white rounded-2xl p-3 min-w-[70px] shadow-lg shadow-blue-100">
            <span className="text-xs uppercase font-medium opacity-80">
              Band
            </span>
            <span className="text-2xl font-black leading-none">
              {data?.band_score}
            </span>
          </div>
        </div>
      </div>

      {/* Markaziy qism: Rubrikalar ballari */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {rubrics?.map((item, index) => (
            <div
              key={index}
              className={`${item?.bg} rounded-2xl p-3 flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2">
                <item.icon size={16} className={item?.color} />
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-tight">
                  {item?.label}
                </span>
              </div>
              <span className={`text-lg font-bold ${item?.color}`}>
                {item?.score}
              </span>
            </div>
          ))}
        </div>

        {/* Feedback qismi */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <MessageSquare size={18} className="text-main" />
            <span>Teacher's Feedback</span>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-gray-600 text-sm italic leading-relaxed">
              "{data?.feedback_text}"
            </p>
            {data?.rubric_data?.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 font-medium">
                Note: {data?.rubric_data?.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyResultItem;
