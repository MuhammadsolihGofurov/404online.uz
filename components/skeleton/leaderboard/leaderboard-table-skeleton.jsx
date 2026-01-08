const LeaderboardTableSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <table className="w-full">
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-dashboard-bg">
              {/* Name */}
              <td className="p-4 w-[30%]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                    <div className="h-2 bg-slate-100 rounded w-16"></div>
                  </div>
                </div>
              </td>
              {/* Groups */}
              <td className="p-4 w-[20%]">
                <div className="h-3 bg-slate-100 rounded w-24"></div>
              </td>
              {/* Band Score */}
              <td className="p-4 w-[15%]">
                <div className="h-8 bg-slate-200 rounded-lg w-12 mx-auto"></div>
              </td>
              {/* Status */}
              <td className="p-4 w-[15%]">
                <div className="h-3 bg-slate-100 rounded w-20"></div>
              </td>
              {/* Date */}
              <td className="p-4 w-[15%]">
                <div className="h-3 bg-slate-100 rounded w-20"></div>
              </td>
              {/* Action */}
              <td className="p-4 w-[5%] text-end">
                <div className="h-4 bg-slate-200 rounded-full w-4 ml-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTableSkeleton;
