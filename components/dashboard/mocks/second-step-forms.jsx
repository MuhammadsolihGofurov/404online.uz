import Link from "next/link";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import axios, { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

import {
  DASHBOARD_URL,
  FORGOTPASSWORDUSERNAME_URL,
  MOCKS_CREATE_THIRD_STEP_URL,
} from "@/mock/router";
import {
  PRIVATEAUTHKEY,
  PRIVATEREFRESHKEY,
  PRIVATEUSERTYPE,
} from "@/mock/keys";
import { FileInput, Input, Select } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { MOCK_TYPES, READING_TYPES } from "@/mock/data";
import { useParams } from "@/hooks/useParams";

export default function SecondStepForms() {
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

      const response = await authAxios.post("/mocks/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // c5a4fa1d-97b0-483d-878d-dfe2e95e9e21

      setTimeout(() => {
        router.push(
          MOCKS_CREATE_THIRD_STEP_URL +
            `?mock_id=${response?.data?.id}&mock_type=%${data?.mock_type}`
        );
      }, 500);
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
        type={"title"}
        register={register}
        name={"title"}
        title={intl.formatMessage({ id: "Title" })}
        placeholder={"Mock title"}
        id="title"
        required
        validation={{
          required: intl.formatMessage({ id: "Title is required" }),
        }}
      />
      <Controller
        name="mock_type"
        control={control}
        rules={{ required: intl.formatMessage({ id: "Required" }) }}
        render={({ field }) => (
          <Select
            {...field}
            title={intl.formatMessage({ id: "Mock type" })}
            placeholder={intl.formatMessage({ id: "Select" })}
            options={MOCK_TYPES}
            error={errors.mock_type?.message}
          />
        )}
      />
      {MockTypeWatch == "READING" && (
        <Controller
          name="reading_type"
          control={control}
          rules={{ required: intl.formatMessage({ id: "Required" }) }}
          render={({ field }) => (
            <Select
              {...field}
              title={intl.formatMessage({ id: "Reading type" })}
              placeholder={intl.formatMessage({ id: "Select" })}
              options={READING_TYPES}
              error={errors.reading_type?.message}
            />
          )}
        />
      )}

      {MockTypeWatch == "LISTENING" && (
        <FileInput
          label={intl.formatMessage({ id: "Upload Audio File" })}
          name="audio_file"
          control={control}
          //   rules={{
          //     required: intl.formatMessage({ id: "Audio file is required" }),
          //   }}
          errors={errors}
          accept="audio/*"
        />
      )}

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
