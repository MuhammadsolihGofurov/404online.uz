import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { FileInput, Input, ToggleSwitch } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";

const detectFileType = (file) => {
  if (!file || !file.name) return "OTHER";

  const extension = file.name.split(".").pop().toLowerCase();

  if (extension === "pdf") return "PDF";
  if (["doc", "docx", "txt", "rtf"].includes(extension)) return "DOCX";
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) return "OTHER";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension))
    return "IMAGE";
  if (["mp3", "wav", "ogg", "m4a"].includes(extension)) return "AUDIO";

  return "OTHER";
};

export default function DocumentsModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      file: null,
      is_public: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.title || initialData.name || "",
        description: initialData.description || "",
      });
    }
  }, [initialData, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("is_public", data.is_public);
      if (data.description) formData.append("description", data.description);

      if (data.file && data.file instanceof File) {
        formData.append("file", data.file);

        const detectedType = detectFileType(data.file);
        formData.append("file_type", detectedType);
      }

      let response;
      const baseUrl = "/materials/";
      if (id && initialData) {
        response = await authAxios.patch(`${baseUrl}${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Document updated successfully!" })
        );
      } else {
        response = await authAxios.post(baseUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Document created successfully!" })
        );
      }

      closeModal("documentsModal", response?.data);
    } catch (e) {
      // console.error("Upload Error:", e.response?.data);

      const errorData = e?.response?.data;
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      if (errorData?.file_type) {
        errorMsg = `File Type Error: ${errorData.file_type[0]}`;
      } else if (errorData?.error) {
        errorMsg = JSON.stringify(errorData.error);
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      }

      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  const isEditMode = !!(id && initialData);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({
          id: isEditMode ? "Edit Document" : "Add Document",
        })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6 text-center font-poppins"
      >
        <Input
          type="text"
          register={register}
          name="name"
          title={intl.formatMessage({ id: "Title" })}
          placeholder="Enter document title"
          required
          validation={{
            required: intl.formatMessage({ id: "Title is required" }),
          }}
          error={errors?.name?.message}
        />

        <Input
          type="text"
          register={register}
          name="description"
          title={intl.formatMessage({ id: "Description" })}
          placeholder="Enter description"
          error={errors?.description?.message}
        />

        <FileInput
          label={intl.formatMessage({ id: "Upload File" })}
          name="file"
          control={control}
          rules={{
            required: isEditMode
              ? false
              : intl.formatMessage({ id: "File is required" }),
          }}
          errors={errors?.file?.message}
          // PDF, Word, Excel, Rasm, Audio
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.mp3,.wav"
        />

        {isEditMode && !watch("file") && (
          <p className="text-xs text-gray-500 text-left italic">
            {intl.formatMessage({ id: "Leave empty to keep the current file" })}
          </p>
        )}

        <div>
          <ToggleSwitch control={control} name="is_public" label="Is public" />
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-70"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: isEditMode ? "Save Changes" : "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
