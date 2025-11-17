import React from "react";

export default function ChatsRightMessages() {
  return (
    <>
      {/* Message Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div>
          <div className="font-semibold text-gray-800">Website Redesign</div>
          <div className="text-xs text-gray-500">3 participants</div>
        </div>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Example messages */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div className="bg-gray-100 px-4 py-2 rounded-2xl shadow-sm max-w-sm">
            Hello! Did you check the new UI?
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <div className="bg-main text-white px-4 py-2 rounded-2xl shadow max-w-sm">
            Yes! Looks clean and minimal. I like it.
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t bg-white flex gap-3">
        <input
          type="text"
          placeholder="Write a message..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-main/40"
        />
        <button className="bg-main px-5 py-2 text-white rounded-xl shadow hover:bg-main/90 transition">
          Send
        </button>
      </div>
    </>
  );
}
