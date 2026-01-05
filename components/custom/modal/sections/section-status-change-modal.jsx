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
import {
  filterQuestionTypes,
  MOCK_STATUS,
  QUESTION_TYPES_WITH_IMAGE,
} from "@/mock/data";
import { useParams } from "@/hooks/useParams";

export default function sectionStatusChangeModal({ id, status, sectionType }) {
  const { closeModal } = useModal();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      status: status || "",
    },
  });

  useEffect(() => {
    if (status) {
      setValue("status", status);
    }
  }, [status]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);
      const baseUrl = `/mocks/${sectionType}/`;
      const url = `${baseUrl}${id}/`;
      const method = "patch";

      const formData = new FormData();
      formData.append("status", values.status || "");

      const response = await authAxios({
        method: method,
        url: url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Mock status changed!");
      closeModal("sectionStatusChangeModal", response?.data);
    } catch (e) {
      const errorData = e?.response?.data;
      const errorMsg = errorData?.status
        ? `Status Error: ${errorData.status[0]}`
        : errorData?.detail || "An error occurred";

      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl uppercase">
        Change mock status
      </h1>

      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6"
      >
        {/* Question Type */}
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select {...field} title="Status" options={MOCK_STATUS} />
          )}
        />

        <button
          type="submit"
          disabled={reqLoading}
          className="rounded-xl bg-main flex items-center justify-center gap-1 text-white w-full p-4 font-bold hover:bg-opacity-90 transition-all"
        >
          {reqLoading && <ButtonSpinner />}{" "}
          {intl.formatMessage({ id: "Save changes" })}
        </button>
      </form>
    </div>
  );
}
