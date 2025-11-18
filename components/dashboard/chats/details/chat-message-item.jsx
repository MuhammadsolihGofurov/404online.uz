import React from "react";

export default function ChatMessageItem({ msg, isOwn }) {
  const author = msg.user_full_name || "Member";
  const text = msg.message || "";
  const attachment = msg.attachment_url;

  const renderAttachmentPost = (url) => {
    const cleanUrl = url.split("?")[0];
    const ext = cleanUrl.split(".").pop().toLowerCase();

    // IMAGE — Telegram style post
    if (["jpeg", "jpg", "png", "webp"].includes(ext)) {
      return (
        <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
          <a href={url} target="_blank" title="Open image">
            <img src={url} alt="attachment" className="w-full rounded-t-xl" />
          </a>
          {text && (
            <div className="p-3 text-gray-800 whitespace-pre-line leading-relaxed break-words">
              {text}
            </div>
          )}
        </div>
      );
    }

    // PDF — Telegram style file box
    if (ext === "pdf") {
      return (
        <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
          <a
            href={url}
            target="_blank"
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 border-b transition"
          >
            📄 PDF File
          </a>
          {text && (
            <div className="p-3 text-gray-800 whitespace-pre-line">{text}</div>
          )}
        </div>
      );
    }

    // AUDIO — Telegram style audio block
    if (["mp3", "wav"].includes(ext)) {
      return (
        <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
          <div className="p-3 border-b">
            <audio controls className="w-full">
              <source src={url} type="audio/mpeg" />
            </audio>
          </div>
          {text && (
            <div className="p-3 text-gray-800 whitespace-pre-line">{text}</div>
          )}
        </div>
      );
    }

    // Other files
    return (
      <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
        <a
          href={url}
          target="_blank"
          className="text-blue-500 underline px-4 py-3 block border-b break-all"
        >
          Open attachment
        </a>
        {text && (
          <div className="p-3 text-gray-800 whitespace-pre-line break-words">
            {text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex gap-3 w-full mb-3 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar (others only) */}
      {!isOwn && (
        <div
          className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-700"
          title={author}
        >
          {author[0]?.toUpperCase()}
        </div>
      )}

      {/* If attachment exists → show Telegram-like post */}
      {attachment ? (
        <div className="max-w-sm">{renderAttachmentPost(attachment)}</div>
      ) : (
        // Normal bubble message
        <div
          className={`
            px-4 py-2 rounded-2xl shadow max-w-sm
            ${isOwn ? "bg-main text-white" : "bg-gray-100 text-gray-900"}
          `}
        >
          <div className="text-xs opacity-70 mb-1">
            {isOwn ? "You" : author}
          </div>
          <div className="leading-relaxed whitespace-pre-line break-words">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
