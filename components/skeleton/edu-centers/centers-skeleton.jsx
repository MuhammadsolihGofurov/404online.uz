import React from "react";
import { useIntl } from "react-intl";

export default function CentersTableSkeleton({ rows = 10 }) {
  const intl = useIntl();
  return (
    <div className="overflow-x-auto w-full">
      <table className="bg-white w-full text-textPrimary rounded-2xl">
        <thead>
          <tr className="border-b border-dashboard-bg">
            <th className="text-sm font-bold text-center p-4 w-[5%]">№</th>
            <th className="text-sm font-bold p-4 w-[30%] text-start">
              {intl.formatMessage({ id: "Users" })}
            </th>
            <th className="text-sm font-bold p-4 w-[15%] text-start">
              {intl.formatMessage({ id: "Admins" })}
            </th>
            <th className="text-sm font-bold p-4 w-[15%] text-start">
              {intl.formatMessage({ id: "Teacher’s count" })}
            </th>
            <th className="text-sm font-bold p-4 w-[15%] text-start">
              {intl.formatMessage({ id: "Status" })}
            </th>
            <th className="text-sm font-bold p-4 w-[15%] text-start">
              {intl.formatMessage({ id: "Date" })}
            </th>
            <th className="text-sm font-bold p-4 w-[5%]"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <tr key={idx} className="border-b border-dashboard-bg last:border-b-transparent">
              <td className="p-5 text-center">
                <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
              </td>
              <td className="p-5">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </td>
              <td className="p-5">
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              </td>
              <td className="p-5">
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </td>
              <td className="p-5">
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </td>
              <td className="p-5">
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </td>
              <td className="p-5 text-center">
                <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
