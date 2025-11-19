export default function NotificationItemSkeleton() {
  return (
    <div className="w-full p-4 rounded-xl bg-white flex items-start gap-4 animate-pulse border">
      {/* Icon Skeleton */}
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>

      {/* Text Skeleton */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Label */}
        <div className="w-24 h-3 rounded bg-gray-200"></div>

        {/* Message */}
        <div className="w-3/4 h-4 rounded bg-gray-200"></div>

        {/* Link */}
        <div className="w-16 h-3 rounded bg-gray-200"></div>

        {/* Timestamp */}
        <div className="w-20 h-3 rounded bg-gray-200 mt-1"></div>
      </div>
    </div>
  );
}
