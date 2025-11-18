// components/ChatMessagesBody.jsx
import React, { useEffect, useRef } from "react";
import { ChatMessageItem } from ".";

export default function ChatMessagesBody({ chat }) {
  const { messages = [], isConnected } = chat || {};
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto h-[85%] p-4 space-y-4 relative bg-gray-50"
    >
      <div className="py-1 px-2 sticky top-2 left-2 text-xs text-gray-500 bg-white inline-block rounded-full">
        Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>
      {console.log(messages)}

      {messages.length === 0 ? (
        <div className="py-6 text-sm text-center text-gray-400">
          No messages yet.
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessageItem key={msg.id} msg={msg} isOwn={Boolean(msg.is_own)} />
        ))
      )}
    </div>
  );
}
