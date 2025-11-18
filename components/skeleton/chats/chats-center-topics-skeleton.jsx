export function ChatsCenterTopicsSkeleton() {
  return (
    <div className="px-3 flex flex-col gap-3 h-[75vh] overflow-y-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-gray-100 animate-pulse flex flex-col gap-2"
        >
          <div className="h-3 w-3/5 bg-gray-300 rounded"></div>
          <div className="h-2 w-4/5 bg-gray-300 rounded"></div>
          <div className="h-2 w-1/4 bg-gray-300 rounded mt-1"></div>
        </div>
      ))}
    </div>
  );
}
