import React, { useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { Input } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { MOCK_TYPES } from "@/mock/data";
import { useParams } from "@/hooks/useParams";
import Select from "@/components/custom/details/select";

export default function ThirdStepForms() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
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
      title: "",
      mock_type: "",
    },
  });
  const { findParams } = useParams();

  const MockTypeWatch = watch("mock_type");

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("category", findParams("category"));
      formData.append("mock_type", data.mock_type);

      if (data.mock_type === "READING" && data.reading_type) {
        formData.append("reading_type", data.reading_type);
      }

      if (data.mock_type === "LISTENING" && data.audio_file) {
        formData.append("audio_file", data.audio_file);
      }

      const response = await authAxios.post("/mock-sections/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (e) {
      toast.error(
        e?.response?.data?.error?.detail?.[0] ||
          intl.formatMessage({ id: "Something went wrong" })
      );
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitFn)} className="grid grid-cols-2 gap-5">
      <Input
        type={"instructions"}
        register={register}
        name={"instructions"}
        title={intl.formatMessage({ id: "Instructions" })}
        placeholder={"Title"}
        id="title"
      />
      <Controller
        name="part_number"
        control={control}
        rules={{ required: intl.formatMessage({ id: "Required" }) }}
        render={({ field }) => (
          <Select
            {...field}
            title={intl.formatMessage({ id: "Part Number" })}
            placeholder={intl.formatMessage({ id: "Select" })}
            options={MOCK_TYPES}
            error={errors.mock_type?.message}
          />
        )}
      />
      <div className="w-full col-span-2 flex items-center justify-end">
        <button
          type="submit"
          className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
        >
          {reqLoading ? (
            <ButtonSpinner />
          ) : (
            intl.formatMessage({ id: "Submit" })
          )}
        </button>
      </div>
    </form>
  );
}
