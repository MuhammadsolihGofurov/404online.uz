import React from "react";
import { Clock, BookOpen, Calendar, ChevronRight } from "lucide-react";

const SectionItem = ({ data }) => {

  const statusStyles = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    EXAM: "bg-red-50 text-red-600 border-red-100",
    PRACTICE: "bg-blue-50 text-blue-600 border-blue-100",
    HOMEWORK: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const formatDate = (dadataring) => {
    return new Date(dadataring).toLocaleDateString("uz-UZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      <div className="flex justify-between items-center mb-5">
        <div
          className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase border ${
            statusStyles[data.status] || statusStyles.DRAFT
          }`}
        >
          {data.status}
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <ChevronRight size={18} />
        </div>
      </div>

      {/* Sarlavha */}
      <h3 className="text-gray-800 font-bold text-lg mb-4 line-clamp-2 leading-tight h-12">
        {data.title}
      </h3>

      {/* Info qismi */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center text-gray-500 bg-gray-50 rounded-xl p-2">
          <Clock size={15} className="mr-2 text-blue-500" />
          <span className="text-xs font-medium">
            {data.duration.substring(0, 5)}
          </span>
        </div>
        <div className="flex items-center text-gray-500 bg-gray-50 rounded-xl p-2">
          <BookOpen size={15} className="mr-2 text-emerald-500" />
          <span className="text-xs font-medium">
            Q: {data.questions_count}
          </span>
        </div>
      </div>

      {/* Pastki qism */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center text-[11px] text-gray-400">
          <Calendar size={13} className="mr-1" />
          {formatDate(data.created_at)}
        </div>
        <button className="text-xs font-medium text-textSecondary">View</button>
      </div>
    </div>
  );
};

export default SectionItem;
