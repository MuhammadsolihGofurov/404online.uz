import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";
import { Input, ToggleSwitch } from "../../details";
import { useOffcanvas } from "@/context/offcanvas-context";
import MockSelectorField from "./details/mock-selector-field";
import { ButtonSpinner } from "../../loading";

export default function TaskExamsGeneratorOffcanvas({ id, initialData }) {
  const intl = useIntl();
  const { closeOffcanvas } = useOffcanvas();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    setValue,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      assigned_groups: [],
      listening_mock: "",
      reading_mock: "",
      writing_mock: "",
      is_published: false,
      status: "CLOSED",
    },
  });

  // 1. Initial ma'lumotlarni o'rnatish
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        // Agar guruhlar obyekt bo'lib kelsa, faqat ID larni olish kerak bo'lishi mumkin
        assigned_groups:
          initialData.assigned_groups?.map((g) => g.id || g) || [],
        listening_mock:
          initialData.listening_mock?.id || initialData.listening_mock || "",
        reading_mock:
          initialData.reading_mock?.id || initialData.reading_mock || "",
        writing_mock:
          initialData.writing_mock?.id || initialData.writing_mock || "",
        is_published: initialData.is_published || false,
        status: initialData.status || "CLOSED",
      });
    }
  }, [initialData, reset]);

  // 2. Submit funksiyasi (JSON formatda)
  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      // Backend kutayotgan aniq format
      const payload = {
        ...data,
        assigned_groups: data.assigned_groups.map((g) => g.id || g),
      };

      const baseUrl = "/tasks/exams/";
      let response;

      if (id) {
        response = await authAxios.patch(`${baseUrl}${id}/`, payload);
        toast.success(intl.formatMessage({ id: "Exam updated successfully!" }));
      } else {
        response = await authAxios.post(baseUrl, payload);
        toast.success(intl.formatMessage({ id: "Exam created successfully!" }));
      }

      setTimeout(() => {
        closeOffcanvas("taskExamsGeneratorOffcanvas", response?.data);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Error");
    } finally {
      setReqLoading(false);
    }
  };

  // Guruhlarni olish (Select uchun)
  const { data: groups } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  return (
    <div className="flex flex-col gap-8 p-1">
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-5">
          <Input
            register={register}
            name="title"
            title={intl.formatMessage({ id: "Exam Title" })}
            required
            error={errors?.title?.message}
          />

          <Input
            register={register}
            name="description"
            title={intl.formatMessage({ id: "Description" })}
          />

          <Controller
            name="assigned_groups"
            control={control}
            render={({ field }) => (
              <MultiSelect
                {...field}
                title={intl.formatMessage({ id: "Assign Groups" })}
                options={groups || []}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* 3. Mocklarni tanlash qismi (Har biri alohida scroll bilan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="listening_mock"
            control={control}
            render={({ field }) => (
              <MockSelectorField
                title="Listening Mock"
                type="listening"
                locale={router.locale}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="reading_mock"
            control={control}
            render={({ field }) => (
              <MockSelectorField
                title="Reading Mock"
                type="reading"
                locale={router.locale}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="writing_mock"
            control={control}
            render={({ field }) => (
              <MockSelectorField
                title="Writing Mock"
                type="writing"
                locale={router.locale}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex justify-end items-center bg-gray-50 p-4 rounded-xl">
          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-xl bg-main text-white px-8 py-3 hover:bg-opacity-90 transition-all flex items-center gap-2"
          >
            {reqLoading && <ButtonSpinner />}{" "}
            {intl.formatMessage({ id: "Save Exam" })}
          </button>
        </div>
      </form>
    </div>
  );
}
