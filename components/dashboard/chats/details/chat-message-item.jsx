import React from "react";

const ATTACHMENT_IMAGE_TYPES = ["jpeg", "jpg", "png", "webp"];
const ATTACHMENT_AUDIO_TYPES = ["mp3", "wav"];

function getExtension(attachment) {
  const source = attachment?.original_name || attachment?.url || "";
  const clean = source.split("?")[0];
  const parts = clean.split(".");
  if (parts.length <= 1) return "";
  return parts.pop().toLowerCase();
}

function renderAttachment(attachment) {
  const url = attachment?.url;
  if (!url) return null;
  const ext = getExtension(attachment);
  const name = attachment?.original_name || "attachment";

  if (ATTACHMENT_IMAGE_TYPES.includes(ext)) {
    return (
      <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block max-h-[320px] bg-gray-100"
        >
          <img src={url} alt={name} className="w-full object-cover" />
        </a>
        <div className="px-4 py-2 text-sm text-gray-600 truncate">{name}</div>
      </div>
    );
  }

  if (ext === "pdf") {
    return (
      <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-200 transition"
        >
          📄 <span className="truncate">{name}</span>
        </a>
      </div>
    );
  }

  if (ATTACHMENT_AUDIO_TYPES.includes(ext)) {
    const audioType = attachment?.content_type || "audio/mpeg";
    return (
      <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
        <div className="p-3 border-b">
          <audio controls className="w-full">
            <source src={url} type={audioType} />
          </audio>
        </div>
        <div className="px-4 py-2 text-sm text-gray-600 truncate">{name}</div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm max-w-sm overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-500 underline px-4 py-3 block break-all"
      >
        {name}
      </a>
    </div>
  );
}

export default function ChatMessageItem({ msg, isOwn }) {
  const author = msg.user_full_name || "Member";
  const text = msg.message || "";
  const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
  const hasAttachments = attachments.length > 0;

  return (
    <div
      className={`flex gap-3 w-full mb-3 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {!isOwn && (
        <div
          className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-700"
          title={author}
        >
          {author[0]?.toUpperCase()}
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-full sm:max-w-xl">
        {hasAttachments &&
          attachments.map((attachment, index) => {
            const content = renderAttachment(attachment);
            if (!content) return null;
            return (
              <div key={attachment.id || `${attachment.url}-${index}`}>
                {content}
              </div>
            );
          })}

        {text && (
          <div
            className={`
              px-4 py-2 rounded-2xl shadow break-words
              ${isOwn ? "bg-main text-white" : "bg-gray-100 text-gray-900"}
            `}
          >
            <div className="text-xs opacity-70 mb-1">
              {isOwn ? "You" : author}
            </div>
            <div className="leading-relaxed whitespace-pre-line">{text}</div>
          </div>
        )}

        {!text && !hasAttachments && (
          <div
            className={`px-4 py-2 rounded-2xl shadow ${
              isOwn ? "bg-main text-white" : "bg-gray-100 text-gray-900"
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {isOwn ? "You" : author}
            </div>
            <div className="text-sm text-gray-500">Shared an attachment</div>
          </div>
        )}
      </div>
    </div>
  );
}
