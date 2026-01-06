import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";
import Select from "../../details/select";
import { MOCK_TEMPLATES, TASK_TYPE, TEMPLATE_D_LEVEL } from "@/mock/data";
import { Input, ToggleSwitch } from "../../details";
import { DateTimePickerField } from "../../details/date-picker-custom";
import { useParams } from "@/hooks/useParams";

export default function TaskEditModal({ id, title, description, deadline }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();
  const { findParams } = useParams();
  const type = findParams("type");

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    watch,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: title,
      description: description,
      deadline: new Date(deadline),
    },
  });

  useEffect(() => {
    setValue("title", title);
    setValue("description", description);
    setValue("deadline", new Date(deadline));
  }, [title, description, deadline]);

  const submitFn = async (data) => {
    const { title, description, deadline } = data;

    try {
      setReqLoading(true);

      const payload = {
        title,
        description,
        deadline,
      };

      let response;
      const baseUrl = `/tasks/${type}/`;

      response = await authAxios.patch(`${baseUrl}${id}/`, payload);

      setTimeout(() => {
        closeModal("taskEditModal", response?.data);
      }, 500);
    } catch (e) {
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      toast.error(errorMsg);
      console.error(e);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Task" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 gap-5">
          {/* Title */}
          <Input
            type="text"
            register={register}
            name="title"
            title={intl.formatMessage({ id: "Title" })}
            placeholder="title"
            required
            validation={{
              required: intl.formatMessage({ id: "Title is required" }),
            }}
            error={errors?.title?.message}
          />
          {/* Description */}
          <Input
            type="text"
            register={register}
            name="description"
            title={intl.formatMessage({ id: "Description" })}
            placeholder="description"
            required
            validation={{
              required: intl.formatMessage({ id: "Description is required" }),
            }}
            error={errors?.description?.message}
          />
          {/* Deadline */}
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DateTimePickerField {...field} title="Deadline" required />
            )}
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-main flex items-center gap-1 justify-center sm:w-auto w-full text-white p-4 hover:bg-blue-800 transition-colors duration-200"
        >
          {reqLoading && <ButtonSpinner />}{" "}
          {intl.formatMessage({ id: "Submit" })}
        </button>
      </form>
    </div>
  );
}
