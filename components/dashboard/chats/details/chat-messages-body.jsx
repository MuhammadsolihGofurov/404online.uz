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
    <div ref={containerRef} className="flex-1 overflow-y-auto h-[85%] p-4 space-y-4">
      <div className="text-xs text-gray-500 mb-2">
        Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>
      {/* {console.log(messages)} */}

      {messages.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-6">
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
