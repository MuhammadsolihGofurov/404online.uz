import React from "react";
import { useIntl } from "react-intl";

export default function ChatsCenterTopics() {
  const intl = useIntl();

  return (
    <>
      <div className="p-3 font-semibold text-gray-700 text-sm tracking-wide">
        {intl.formatMessage({ id: "Topics" })}
      </div>

      <div className="px-3 flex flex-col gap-2">
        {["Website redesign", "API integration", "Sprint tasks"].map(
          (topic, i) => (
            <div
              key={i}
              className="p-4 rounded-xl cursor-pointer shadow-sm bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="font-medium text-gray-800">{topic}</div>
              <div className="text-xs text-gray-500 mt-1">
                Last update: 2h ago
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
