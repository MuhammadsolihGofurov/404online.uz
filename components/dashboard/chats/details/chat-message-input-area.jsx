import { Paperclip, SendHorizontal, X, FileText, Image } from "lucide-react";
import React, { useState, useEffect } from "react"; // useEffect qo'shildi
import { useForm } from "react-hook-form";

const IMAGE_MIME_REGEX = /^image\/(jpeg|png|gif|webp|tiff|bmp)$/i;

export default function ChatMessageInputArea({ chat, topicId }) {
  const [sending, setSending] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
    setValue,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      message: "",
      file: null,
    },
  });

  const file = watch("file");

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }

    const isImage = IMAGE_MIME_REGEX.test(file.type);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
    }

    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl); // Agar Object URL ishlatilgan bo'lsa tozalash
      }
    };
  }, [file]);

  const canSend =
    Boolean(chat?.isConnected) && (isDirty || Boolean(file)) && isValid;

  // ... onSubmit, handleFileChange funksiyalari o'zgarishsiz qoldi ...

  const onSubmit = async (data) => {
    if (!canSend) return;

    try {
      setSending(true);
      await chat.sendMessage({
        text: data.message?.trim(),
        file: data.file,
        topicId,
      });

      reset({ message: "", file: null });
      setFilePreviewUrl(null);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setValue("file", selectedFile, { shouldDirty: true, shouldValidate: true });
    e.target.value = null;
  };

  const removeFile = () => {
    setValue("file", null, { shouldDirty: true, shouldValidate: true });
    setFilePreviewUrl(null);
  };

  const isFileImage = file && IMAGE_MIME_REGEX.test(file.type);

  return (
    <div className="p-4 border-t bg-white">
      {file && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 relative">
            {isFileImage && filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt={file.name}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            )}
            {/* Faylni olib tashlash tugmasi */}
            <button
              type="button"
              onClick={removeFile}
              className="p-1 rounded-full -top-1 -right-1 absolute text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="Faylni o'chirish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Xabar yuborish formasi */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-3 items-center"
      >
        {/* File input (O'zgarishsiz) */}
        <label className="rounded-xl cursor-pointer relative">
          <Paperclip className="w-5 h-5 text-gray-400 hover:text-main" />
          <input
            type="file"
            className="opacity-0 invisible absolute"
            onChange={handleFileChange}
            multiple
          />
        </label>

        {/* Message input (O'zgarishsiz) */}
        <input
          type="text"
          placeholder="Write a message..."
          disabled={!chat?.isConnected || chat?.readOnly}
          {...register("message")}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2"
        />

        {/* Send icon button (O'zgarishsiz) */}
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
