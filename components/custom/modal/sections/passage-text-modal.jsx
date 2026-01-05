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
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

export default function PassageTextModal({ id, partInfo }) {
  const { closeModal } = useModal();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  const sectionType = findParams("section") || "";
  // const { partData } = useSelector((state) => state.settings);

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
      text_content: partInfo?.text_content || "",
    },
  });

  useEffect(() => {
    if (partInfo) {
      reset({
        ...partInfo,
      });
    }
  }, [partInfo, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);
      const baseUrl = `/editor/reading-passages/`;
      const url = id ? `${baseUrl}${id}/` : baseUrl;
      const method = id ? "patch" : "post";

      const formData = new FormData();
      formData.append("text_content", values.text_content || "");

      const response = await authAxios({
        method: method,
        url: url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Reading passage saved successfully!");
      closeModal("passageTextModal", response?.data);
    } catch (e) {
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
        {sectionType} - {id ? "Edit passage text" : "Add passage text"}
      </h1>

      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-5">
          <RichTextEditor
            name="text_content"
            control={control}
            label="Passage Body"
            placeholder="Paste or write your IELTS passage here..."
            error={errors.text_content}
            required
          />
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
