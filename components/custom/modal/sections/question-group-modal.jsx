import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { FileInput, Input, Select } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin } from "@/mock/roles";
import { filterQuestionTypes, QUESTION_TYPES_WITH_IMAGE } from "@/mock/data";
import { useParams } from "@/hooks/useParams";

export default function QuestionGroupModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);
  const sectionType = findParams("section") || "";
  const partId = findParams("partId") || "";
  const passageId = findParams("partId") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      instruction: initialData?.instruction || "",
      question_type: initialData?.question_type || "",
      image: initialData?.image || "",
      order: initialData?.order || 1,
    },
  });

  const currentQuestionType = watch("question_type");

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);

      // 1. Dinamik URL yaratish (listening-groups yoki reading-groups)
      const baseUrl = `/editor/${sectionType}-groups/`;
      const url = id ? `${baseUrl}${id}/` : baseUrl;
      const method = id ? "patch" : "post";

      const formData = new FormData();

      formData.append("instruction", values.instruction);
      formData.append("question_type", values.question_type);
      formData.append("order", values.order);

      if (sectionType === "listening") {
        formData.append("part", partId);
      } else if (sectionType === "reading") {
        formData.append("passage", passageId);
      }

      if (values.file && values.file instanceof File) {
        formData.append("image", values.file);
      }

      const response = await authAxios({
        method: method,
        url: url,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        intl.formatMessage({
          id: id
            ? "Question group updated successfully!"
            : "Question group created successfully!",
        })
      );

      setTimeout(() => {
        closeModal("questionGroupModal", response?.data);
      }, 500);
    } catch (e) {
      console.error("Group Submit Error:", e);
      const errorMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        "An error occurred";
      toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {id
          ? intl.formatMessage({ id: "Edit group" })
          : intl.formatMessage({ id: "Add group" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <Input
              type="text"
              register={register}
              name="instruction"
              title={intl.formatMessage({ id: "Instruction" })}
              placeholder="Questions 1-5: Complete the notes below"
              required
              validation={{
                required: intl.formatMessage({ id: "Instruction is required" }),
              }}
            />
          </div>
          <Controller
            name="question_type"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Question type" })}
                options={filterQuestionTypes(sectionType)}
                error={errors.question_type?.message}
              />
            )}
          />
          <Input
            type="text"
            register={register}
            name="order"
            title={intl.formatMessage({ id: "Order" })}
            placeholder="1"
            required
            validation={{
              required: intl.formatMessage({ id: "Order is required" }),
            }}
          />

          {/* image field */}
          {QUESTION_TYPES_WITH_IMAGE.includes(currentQuestionType) && (
            <div className="col-span-1 md:col-span-2">
              <FileInput
                label={intl.formatMessage({ id: "Upload File" })}
                name="file"
                control={control}
                errors={errors?.file?.message}
                accept="image/*"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : id ? (
              intl.formatMessage({ id: "Update" })
            ) : (
              intl.formatMessage({ id: "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
