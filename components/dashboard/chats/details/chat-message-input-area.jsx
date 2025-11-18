import { Paperclip, SendHorizontal, X, FileText } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";

const IMAGE_MIME_REGEX = /^image\/(jpeg|png|gif|webp|tiff|bmp)$/i;
const MAX_ATTACHMENTS = 10;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatMessageInputArea({ chat, topicId }) {
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [inputError, setInputError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      message: "",
    },
  });

  const messageValue = watch("message") ?? "";
  const trimmedMessage = messageValue.trim();
  const hasFiles = attachments.length > 0;
  const hasText = trimmedMessage.length > 0;
  const canSend =
    Boolean(chat?.isConnected) && !chat?.readOnly && (hasText || hasFiles);

  const previewEntries = useMemo(() => {
    const canPreview =
      typeof window !== "undefined" &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function";

    return attachments.map((file, idx) => {
      const isImage = IMAGE_MIME_REGEX.test(file.type);
      const previewUrl = isImage && canPreview ? URL.createObjectURL(file) : null;
      return {
        key: `${file.name}-${file.lastModified}-${idx}`,
        file,
        isImage,
        previewUrl,
      };
    });
  }, [attachments]);

  useEffect(() => {
    return () => {
      previewEntries.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [previewEntries]);

  const onSubmit = async (data) => {
    if (!canSend) {
      setInputError("Write a message or attach files to send.");
      return;
    }

    try {
      setSending(true);
      await chat.sendMessage({
        text: data.message?.trim(),
        files: attachments,
      });

      reset({ message: "" });
      setAttachments([]);
      setInputError("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setAttachments((prev) => {
      const remainingSlots = MAX_ATTACHMENTS - prev.length;
      if (remainingSlots <= 0) {
        setInputError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
        return prev;
      }

      if (selectedFiles.length > remainingSlots) {
        setInputError(
          `Only ${MAX_ATTACHMENTS} files are allowed. Extra files were ignored.`,
        );
      } else {
        setInputError("");
      }

      const allowedFiles = selectedFiles.slice(0, remainingSlots);
      return [...prev, ...allowedFiles];
    });

    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
    setInputError("");
  };

  return (
    <div className="p-4 border-t bg-white">
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {previewEntries.map(({ key, file, isImage, previewUrl }, idx) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2"
            >
              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-gray-500 hover:text-red-500 p-1"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {inputError && (
        <p className="text-xs text-red-500 mb-2">{inputError}</p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-3 items-center"
      >
        <label className="rounded-xl cursor-pointer relative">
          <Paperclip className="w-5 h-5 text-gray-400 hover:text-main" />
          <input
            type="file"
            className="opacity-0 invisible absolute"
            onChange={handleFileChange}
            multiple
          />
        </label>

        <input
          type="text"
          placeholder={
            chat?.readOnly ? "Channel is read-only" : "Write a message..."
          }
          disabled={!chat?.isConnected || chat?.readOnly}
          {...register("message")}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2"
        />

        <button
          type="submit"
          disabled={!canSend || sending}
          className={`bg-main p-2 text-white rounded-full w-10 h-10 flex items-center justify-center ${
            !canSend ? "opacity-50 cursor-not-allowed" : "hover:bg-main/90"
          }`}
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-t-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
