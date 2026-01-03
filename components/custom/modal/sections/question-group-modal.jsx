import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import {
  FileInput,
  Input,
  RichTextEditor,
  Select,
  Textarea,
} from "../../details"; // Textarea import qilindi
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { filterQuestionTypes, QUESTION_TYPES_WITH_IMAGE } from "@/mock/data";
import { useParams } from "@/hooks/useParams";

export default function QuestionGroupModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  const sectionType = findParams("section") || "";
  const partId = findParams("partId") || "";
  const passageId = findParams("partId") || ""; // Reading uchun passageId
  const partNumber = findParams("partNumber") || "";

  // Common options kerak bo'ladigan turlar ro'yxati
  const TYPES_WITH_COMMON_OPTIONS = [
    "MATCH_HEADINGS",
    // "MATCH_INFO",
    "MATCH_ENDINGS",
    "MATCH_FEATURES",
  ];

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
      instruction: initialData?.instruction || "",
      question_type:
        initialData?.question_type || initialData?.group_type || "",
      image: initialData?.image || "",
      order: initialData?.order || 1,
      // Yangi maydonlar
      common_options: initialData?.common_options?.join("\n") || "",
      text_content: initialData?.text_content || "",
    },
  });

  const currentQuestionType = watch("question_type");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        common_options: initialData?.common_options?.join("\n") || "",
      });
    }
  }, [initialData, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);
      const baseUrl = `/editor/${sectionType}-groups/`;
      const url = id ? `${baseUrl}${id}/` : baseUrl;
      const method = id ? "patch" : "post";

      const formData = new FormData();
      formData.append("instruction", values.instruction);
      formData.append("order", values.order);

      if (sectionType === "listening") {
        formData.append("part", partId);
        formData.append("question_type", values.question_type);
      } else if (sectionType === "reading") {
        formData.append("group_type", values.question_type);
        formData.append("passage", passageId);
        formData.append("text_content", values.text_content || "");

        const optionsArray = values.common_options
          ? values.common_options
              .split("\n")
              .map((opt) => opt.trim())
              .filter(Boolean)
          : [];

        formData.append("common_options", JSON.stringify(optionsArray));
      }

      if (values.file && values.file instanceof File) {
        formData.append("image", values.file);
      }

      const response = await authAxios({
        method: method,
        url: url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Question group saved successfully!");
      closeModal("questionGroupModal", response?.data);
    } catch (e) {
      console.error("Group Submit Error:", e);
      const errorData = e?.response?.data;
      const errorMsg = errorData?.common_options
        ? `Common Options Error: ${errorData.common_options[0]}`
        : errorData?.detail || "An error occurred";

      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl uppercase">
        {sectionType} - {id ? "Edit Group" : "Add Group"}
      </h1>

      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Instruction */}
          <div className="col-span-1 md:col-span-2">
            <Input
              register={register}
              name="instruction"
              title="Instruction"
              placeholder="e.g. Choose the correct heading for paragraphs A-E"
              required
            />
          </div>

          {/* Question Type */}
          <Controller
            name="question_type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                title="Question Type"
                options={filterQuestionTypes(sectionType, partNumber)}
              />
            )}
          />

          {/* Order */}
          <Input type="number" register={register} name="order" title="Order" />

          {/* COMMON OPTIONS (Only for Reading & Specific Types) */}
          {sectionType === "reading" &&
            TYPES_WITH_COMMON_OPTIONS.includes(currentQuestionType) && (
              <div className="col-span-1 md:col-span-2">
                <Textarea
                  register={register}
                  name="common_options"
                  title="List of Options (One per line)"
                  placeholder={
                    "i. Heading one\nii. Heading two\niii. Heading three"
                  }
                  rows={6}
                />
                <p className="text-[10px] text-left text-gray-400 mt-1">
                  * These options will be displayed in a box above the
                  questions.
                </p>
              </div>
            )}

          {/* TEXT CONTENT (Only for Reading) */}
          {sectionType === "reading" && (
            <div className="col-span-1 md:col-span-2">
              <RichTextEditor
                name="text_content"
                control={control}
                label="Passage Body"
                placeholder="Paste or write your IELTS passage here..."
                error={errors.text_content}
              />
            </div>
          )}

          {/* Image Field */}
          {QUESTION_TYPES_WITH_IMAGE.includes(currentQuestionType) && (
            <div className="col-span-1 md:col-span-2">
              <FileInput
                label="Upload Image/Diagram"
                name="file"
                control={control}
                accept="image/*"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={reqLoading}
          className="rounded-xl bg-main flex items-center justify-center gap-1 text-white w-full p-4 font-bold hover:bg-opacity-90 transition-all"
        >
          {reqLoading && <ButtonSpinner />} {id ? "Update text" : "Create text"}
        </button>
      </form>
    </div>
  );
}
