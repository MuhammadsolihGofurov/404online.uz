import React from "react";
import GroupListItemSkeleton from "./group-list-item-skeleton";

export default function GroupListSkeleton() {
  return (
    <div className="bg-white rounded-2xl w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 p-5 sm:p-6">
      {Array.from({ length: 12 }).map((_, idx) => (
        <GroupListItemSkeleton key={idx} />
      ))}
    </div>
  );
}
