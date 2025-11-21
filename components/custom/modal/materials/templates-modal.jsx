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
import { MOCK_TEMPLATES, TEMPLATE_D_LEVEL } from "@/mock/data";
import { Input, ToggleSwitch } from "../../details";

export default function TemplatesModal({
  id,
  old_title,
  old_description,
  old_category,
  old_difficulty_level,
  old_mocks,
}) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: old_title || "",
      description: old_description || "",
      category: old_category || "",
      difficulty_level: old_difficulty_level || "",
      mocks: old_mocks || [],
    },
  });

  useEffect(() => {
    if (old_title && old_category && old_difficulty_level && old_mocks)
      reset({
        title: old_title,
        description: old_description,
        category: old_category,
        difficulty_level: old_difficulty_level,
        mocks: old_mocks,
      });
  }, [
    old_title,
    old_description,
    old_category,
    old_difficulty_level,
    old_mocks,
    reset,
  ]);

  const submitFn = async (data) => {
    const { title, mocks, description, category, difficulty_level } = data;
    try {
      setReqLoading(true);

      const payload = {
        title,
        description,
        category,
        difficulty_level,
        mocks: mocks?.map((item) => item?.id),
      };

      console.error(payload);

      let response;
      const baseUrl = "/material-templates/";
      if (id) {
        response = await authAxios.patch(`${baseUrl}${id}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Template updated successfully!" })
        );
      } else {
        response = await authAxios.post(baseUrl, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Template created successfully!" })
        );
      }

      setTimeout(() => {
        closeModal("templatesModal", response?.data);
      }, 500);
    } catch (e) {
      const errorData = e?.response?.data;
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      if (errorData?.error?.mocks) {
        errorMsg = errorData.error?.mocks?.[0];
      } else if (errorData?.error?.category) {
        errorMsg = errorData.error?.category?.[0];
      } else if (errorData?.error?.difficulty_levelf) {
        errorMsg = errorData.error?.difficulty_levelf?.[0];
      }

      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: mocksData } = useSWR(
    ["/mocks/", router.locale],
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
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Template" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            error={errors?.name?.message}
          />
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
          <Controller
            name="category"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Category" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={MOCK_TEMPLATES}
                error={errors.role?.message}
              />
            )}
          />
          <Controller
            name="difficulty_level"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Difficulty level" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={TEMPLATE_D_LEVEL}
                error={errors.difficulty_level?.message}
              />
            )}
          />
          <div className="sm:col-span-2 col-span-1">
            <Controller
              name="mocks"
              control={control}
              rules={{ required: intl.formatMessage({ id: "Required" }) }}
              defaultValue={old_mocks || []}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  title={intl.formatMessage({ id: "Mocks" })}
                  placeholder={intl.formatMessage({ id: "Select" })}
                  options={mocksData || []}
                  error={errors.mocks?.message}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between  items-center gap-4">
          <div>
            <ToggleSwitch
              control={control}
              name="is_public"
              label="Is public"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center sm:w-auto w-full text-white p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
