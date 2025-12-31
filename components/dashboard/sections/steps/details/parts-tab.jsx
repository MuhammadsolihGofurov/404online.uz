import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React from "react";

export default function PartsTab({ items, activePartId, sectionType }) {
  const router = useRouter();
  const { query, pathname } = router;
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const numA = a.part_number || a.passage_number || a.task_number || 0;
      const numB = b.part_number || b.passage_number || b.task_number || 0;
      return numA - numB;
    });
  }, [items]);

  const handleTabClick = (id, number) => {
    router.push({
      pathname: pathname,
      query: {
        ...query,
        partId: id,
        partNumber: number,
      },
    });
  };

  return (
    <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
      {sortedItems.map((item) => {
        const itemNumber =
          item.part_number || item.passage_number || item.task_number;
        const isActive = String(activePartId) === String(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(item.id, itemNumber)}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${
              isActive
                ? "bg-white text-main shadow-sm scale-100 opacity-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 opacity-70"
            }`}
          >
            {sectionType === "listening" && `Part ${itemNumber}`}
            {sectionType === "reading" && `Passage ${itemNumber}`}
            {sectionType === "writing" && `Task ${itemNumber}`}
          </button>
        );
      })}
    </div>
  );
}
