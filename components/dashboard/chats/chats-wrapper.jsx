import React from "react";
import { ChatsCenterTopics, ChatsLeftGroups, ChatsRightMessages } from ".";

export default function ChatsWrapper({ role, loading }) {
  return (
    <div className="grid grid-cols-12 bg-gray-50 rounded-2xl overflow-hidden h-[85vh]">
      {/* LEFT – GROUPS LIST */}
      <div className="col-span-12 lg:col-span-2 flex flex-col h-full border-r border-gray-200 bg-white">
        <ChatsLeftGroups loading={loading} />
      </div>

      {/* RIGHT MAIN WHITE AREA */}
      <div className="col-span-12 sm:col-span-10 bg-white hidden lg:grid grid-cols-12 ">
        {/* CENTER – TOPICS */}
        <div className="col-span-4 md:flex flex-col hidden border-r border-gray-200 h-full overflow-y-auto">
          <ChatsCenterTopics loading={loading} />
        </div>

        {/* RIGHT – MESSAGES */}
        <div className="col-span-12 md:col-span-8 h-full overflow-y-auto flex flex-col">
          <ChatsRightMessages loading={loading} />
        </div>
      </div>
    </div>
  );
}
