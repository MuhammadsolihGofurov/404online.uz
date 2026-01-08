const MyResultItemSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Yuqori qism: Sarlavha va Band Score Skeleton */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-50">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            {/* Sarlavha (Title) */}
            <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Sana Skeleton */}
              <div className="h-4 bg-slate-100 rounded w-24"></div>
              {/* Vaqt Skeleton */}
              <div className="h-6 bg-slate-100 rounded-md w-32"></div>
            </div>
          </div>

          {/* Band Score Box Skeleton */}
          <div className="h-[62px] w-[80px] bg-slate-200 rounded-2xl ml-4"></div>
        </div>
      </div>

      {/* Task title text skeleton */}
      <div className="px-6 pt-5">
        <div className="h-5 bg-slate-100 rounded w-1/2"></div>
      </div>

      {/* Markaziy qism: Submissions (Listening, Reading, Writing) */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col min-h-16 items-center p-2 bg-slate-50 rounded-xl border border-slate-50"
            >
              <div className="w-4 h-4 bg-slate-200 rounded-full mb-2"></div>
              <div className="w-10 h-2 bg-slate-100 rounded mb-2"></div>
              <div className="w-6 h-3 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Button Skeleton */}
        <div className="flex justify-end">
          <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
        </div>
      </div>
    </div>
  );
};

export default MyResultItemSkeleton;
