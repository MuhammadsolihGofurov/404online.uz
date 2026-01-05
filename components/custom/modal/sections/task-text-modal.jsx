import React, { useState, useEffect } from "react";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { Input, RichTextEditor, ImageUploadBox } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";

export default function TaskTextModal({ id, partInfo }) {
  const { closeModal } = useModal();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  // Parametrlarni olish
  const sectionType = findParams("section") || "writing";
  const sectionId = findParams("sectionId"); // Mock ID (mock: sectionId)
  const partId = findParams("partId"); // Id
  const partNumber = findParams("partNumber"); // Task tartib raqami (task_number: partNumber)

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      prompt: partInfo?.prompt || "",
      min_words: partInfo?.min_words || 150,
      image: null,
    },
  });

  // partInfo o'zgarganda formani yangilash (Edit holati uchun)
  useEffect(() => {
    if (partInfo) {
      reset({
        prompt: partInfo.prompt || "",
        min_words: partInfo.min_words || 150,
      });
    }
  }, [partInfo, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);

      // Faqat writing uchun endpoint (id: partId)
      const baseUrl = `/editor/writing-tasks/`;
      const url = id ? `${baseUrl}${id}/` : baseUrl;
      const method = id ? "patch" : "post";

      const formData = new FormData();

      // Siz so'ragan Body maydonlari
      formData.append("prompt", values.prompt || ""); // text_content o'rniga prompt
      formData.append("mock", sectionId); // mock: sectionId
      formData.append("task_number", partNumber); // task_number: partNumber
      formData.append("min_words", values.min_words);

      // Rasm bo'lsa qo'shish
      if (values.image && values.image.length > 0) {
        formData.append("image", values.image[0]);
      }

      const response = await authAxios({
        method: method,
        url: url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Writing task saved successfully!");
      closeModal("taskTextModal", response?.data);
    } catch (e) {
      console.error("Submission error:", e);
      toast.error(e?.response?.data?.detail || "An error occurred");
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl uppercase">
        Writing Task {partNumber} - {id ? "Edit" : "Add"}
      </h1>

      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-5">
          {/* Prompt maydoni */}
          <RichTextEditor
            name="prompt"
            control={control}
            label="Task Prompt"
            placeholder="Write the writing task prompt here..."
            error={errors.prompt}
            required
          />

          {/* Minimal so'zlar soni */}
          <Input
            register={register}
            name="min_words"
            title="Minimum Words"
            placeholder="e.g. 150 or 250"
            required
          />

          {/* Rasm yuklash */}
          <div className="flex flex-col gap-2">
            <span className="text-textSecondary font-semibold text-sm">
              Task Image (optional)
            </span>
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploadBox
                  value={field.value}
                  onChange={(files) => field.onChange(files)}
                />
              )}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={reqLoading}
          className="rounded-xl bg-main flex items-center justify-center gap-1 text-white w-full p-4 font-bold hover:bg-opacity-90 transition-all"
        >
          {reqLoading && <ButtonSpinner />}
          {id ? "Update Writing Task" : "Create Writing Task"}
        </button>
      </form>
    </div>
  );
}
