import React from "react";
import { CheckCircle, Clock, MoreHorizontal } from "lucide-react";

const LeaderboardItem = ({ item }) => {
  // Sanani formatlash
  const date = item?.completed_at
    ? new Date(item.completed_at).toLocaleDateString("uz-UZ")
    : "---";

  return (
    <tr className="border-b border-dashboard-bg hover:bg-slate-50 transition-colors">
      {/* 1. Name & Avatar */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-300 bg-opacity-20 text-main rounded-full flex items-center overflow-hidden justify-center font-bold text-sm">
            {item?.avatar ? (
              <img
                src={img?.avatar}
                title={item?.user_name}
                className="w-full h-full object-cover"
              />
            ) : (
              item?.user_name?.charAt(0)
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm">
              {item?.user_name}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-medium">
              ID: {item?.user_id}
            </span>
          </div>
        </div>
      </td>

      {/* 2. Groups (Exam Title) */}
      <td className="p-4 text-sm text-slate-600 font-medium">
        {item?.exam_task_title}
      </td>

      {/* 3. Approve (Band Score) */}
      <td className="p-4 text-center">
        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg text-sm border border-emerald-100">
          {item?.overall_band_score || "N/A"}
        </span>
      </td>

      {/* 4. Status (Is Graded) */}
      <td className="p-4">
        {item?.is_graded ? (
          <span className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold uppercase tracking-tight">
            <CheckCircle size={14} />
            Graded
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-tight">
            <Clock size={14} />
            Pending
          </span>
        )}
      </td>

      {/* 5. Date */}
      <td className="p-4 text-sm text-slate-500">{date}</td>

      {/* 6. Action */}
      {/* <td className="p-4 text-end">
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
          <MoreHorizontal size={18} />
        </button>
      </td> */}
    </tr>
  );
};

export default LeaderboardItem;
