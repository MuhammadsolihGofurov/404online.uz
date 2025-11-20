import React from "react";
import {
  CalendarDays,
  User,
  Folder,
  ChevronRight,
  FileText,
  Type,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { useIntl } from "react-intl";
import { MOCK_CATEGORIES_TEXT } from "@/mock/data";

const InfoItem = ({ Icon, value }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <Icon size={14} className="text-indigo-500 flex-shrink-0" />
    <span className="text-[11px] font-medium truncate" title={value}>
      {value}
    </span>
  </div>
);

export default function MockListItem({ item }) {
  const formattedDate = formatDate(item?.created_at);
  const intl = useIntl();

  return (
    <div className="group w-full rounded-xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.03] cursor-pointer overflow-hidden relative">
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 rounded-xl transition-all duration-300 pointer-events-none"></div>

      <div className="p-4 bg-gradient-to-br from-indigo-500/90 to-indigo-600 border-b border-indigo-700/50 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-indigo-700 shadow-sm uppercase tracking-wider">
            {MOCK_CATEGORIES_TEXT?.[item?.category] || "Turi"}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-sm font-bold text-white leading-tight mb-1">
          {item?.title || "Sarlavha mavjud emas"}
        </h2>

        {/* ID/Sub-info */}
        <p className="text-[9px] text-indigo-200 font-mono tracking-wider opacity-80">
          ID: {item?.id}
        </p>
      </div>

      {/* Info Section - Tidy Grid */}
      <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4">
        <InfoItem
          Icon={User}
          value={item?.created_by?.full_name || "Unknown"}
        />

        <InfoItem Icon={Folder} value={item?.mock_type} />

        <InfoItem Icon={Type} value={item?.reading_type} />

        <InfoItem Icon={CalendarDays} value={formattedDate} />
      </div>

      {/* Footer/Action Button */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center text-gray-500">
          <FileText size={14} className="mr-1" />
          <span className="text-xs font-semibold">{item?.mock_type}</span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          {intl.formatMessage({ id: "View" })}
          <ChevronRight
            size={14}
            className="mt-0.5 group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}
