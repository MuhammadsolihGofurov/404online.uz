import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { Input } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { UploadCloud, FileAudio } from "lucide-react";

export default function UpdateMockModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
    },
  });

  useEffect(() => {
    if (initialData) reset({ title: initialData.title });
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      let payload = data;
      let headers = {};

      // If we have a file or need to send multipart/form-data
      if (audioFile) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("audio_file", audioFile);
        payload = formData;
        headers = { "Content-Type": "multipart/form-data" };
      }

      const response = await authAxios.patch(`/mocks/${id}/`, payload, {
        headers,
      });
      toast.success(intl.formatMessage({ id: "Mock updated successfully!" }));

      setTimeout(() => {
        closeModal("updateMock", response?.data);
      }, 500);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.error?.detail?.[0] || "Failed to update mock"
      );
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Edit mock" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6 text-center font-poppins"
      >
        <Input
          type="text"
          register={register}
          name="title"
          title={intl.formatMessage({ id: "Title" })}
          placeholder="Mock Title"
          required
          validation={{
            required: intl.formatMessage({ id: "Title is required" }),
          }}
          error={errors.title}
        />

        {initialData?.mock_type === "LISTENING" && (
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-medium text-gray-700">
              {intl.formatMessage({ id: "Audio File (Optional)" })}
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors bg-gray-50 group">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center text-gray-500 group-hover:text-indigo-600 transition-colors">
                {audioFile ? (
                  <>
                    <FileAudio size={32} className="mb-2 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {audioFile.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="mb-2" />
                    <span className="text-sm font-medium">
                      Click to upload new audio
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      MP3, WAV, OGG (Max 50MB)
                    </span>
                  </>
                )}
              </div>
            </div>
            {initialData.audio_file && !audioFile && (
              <p className="text-xs text-gray-500 mt-1">
                Current file: ...{initialData.audio_file.slice(-20)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2">
          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Update" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
