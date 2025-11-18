import { Paperclip } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

export default function ChatMessageInputArea({ chat, topicId }) {
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      message: "",
    },
  });

  const canSend =
    Boolean(chat?.isConnected) && (isDirty || Boolean(file)) && isValid;

  const onSubmit = async (data) => {
    if (!canSend) return;

    try {
      setSending(true);
      await chat.sendMessage({
        text: data.message?.trim(),
        file,
        topicId,
      });

      reset({ message: "" });
      setFile(null);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 border-t bg-white flex gap-3 items-center"
    >
      {/* File input */}
      <label className="rounded-xl cursor-pointer relative">
        <Paperclip className="w-5 h-5 text-gray-400 hover:text-main" />
        <input
          type="file"
          className="opacity-0 invisible absolute"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {/* Message input */}
      <input
        type="text"
        placeholder="Write a message..."
        disabled={!chat?.isConnected || chat?.readOnly}
        {...register("message")}
        className="flex-1 rounded-xl border border-gray-300 px-4 py-2"
      />

      {/* Send button */}
      <button
        type="submit"
        disabled={!canSend || sending}
        className={`bg-main px-5 py-2 text-white rounded-xl ${
          !canSend ? "opacity-50 cursor-not-allowed" : "hover:bg-main/90"
        }`}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
