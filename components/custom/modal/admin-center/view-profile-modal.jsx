import React from "react";
import { useIntl } from "react-intl";
import { formatDateToShort } from "@/utils/funcs";
import { Mail, Users, Calendar, UserCheck, UserX } from "lucide-react";

export default function ViewProfileModal({ data }) {
  const intl = useIntl();

  const roleStyles = {
    STUDENT: "bg-gradient-to-r from-blue-200 to-blue-400 text-white",
    TEACHER: "bg-gradient-to-r from-green-200 to-green-400 text-white",
    CENTER_ADMIN: "bg-gray-300 text-gray-900",
    ASSISTANT: "bg-purple-200 text-purple-800",
  };

  return (
    <div className="w-full bg-white rounded-2xl">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden bg-gray-50">
          {data?.avatar ? (
            <img
              src={data.avatar}
              alt={data.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-textPrimary">{data?.full_name?.slice(0, 1)}</span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-textPrimary">
          {data.full_name}
        </h2>
        <span
          className={`px-4 py-1 text-sm font-semibold rounded-full ${
            roleStyles[data.role]
          }`}
        >
          {data.role.replace("_", " ")}
        </span>
      </div>

      {/* Info Sections */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Mail className="h-5 w-5 text-gray-500" />
          <span className="text-textPrimary break-all">{data.email}</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-textPrimary">
            {intl.formatMessage({ id: "Group" })}: {data.group || "-"}
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {data.is_approved ? (
            <UserCheck className="h-5 w-5 text-green-500" />
          ) : (
            <UserX className="h-5 w-5 text-red-500" />
          )}
          <span className="text-textPrimary">
            {intl.formatMessage({ id: "Approved" })}:{" "}
            {data.is_approved ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-textPrimary">
            {intl.formatMessage({ id: "Created At" })}:{" "}
            {formatDateToShort(data.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-textPrimary">
            {intl.formatMessage({ id: "Updated At" })}:{" "}
            {formatDateToShort(data.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
