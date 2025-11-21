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
  old_is_public, // Agar propsda is_public kelsa
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
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: old_title || "",
      description: old_description || "",
      category: old_category || "",
      difficulty_level: old_difficulty_level || "",
      mocks: old_mocks || [],
      is_public: old_is_public || false,
    },
  });

  const MockCategory = watch("category");

  useEffect(() => {
    if (old_title && old_category && old_difficulty_level && old_mocks)
      reset({
        title: old_title,
        description: old_description,
        category: old_category,
        difficulty_level: old_difficulty_level,
        mocks: old_mocks,
        is_public: old_is_public || false,
      });
  }, [
    old_title,
    old_description,
    old_category,
    old_difficulty_level,
    old_mocks,
    old_is_public,
    reset,
  ]);

  const submitFn = async (data) => {
    const { title, mocks, description, category, difficulty_level, is_public } =
      data;

    try {
      setReqLoading(true);

      // 1. FormData obyekti yaratamiz (Multipart request uchun shart)
      const formData = new FormData();

      // 2. Oddiy maydonlarni qo'shamiz
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("difficulty_level", difficulty_level);
      // Boolean qiymatni stringga o'tkazib yuborgan ma'qul (yoki backend o'zi handle qiladi)
      formData.append("is_public", is_public ? "true" : "false");

      // 3. Arrayni (mocks) to'g'ri formatda qo'shamiz
      // Backend getlist('mocks') qilishi uchun har bir ID alohida 'mocks' kaliti bilan qo'shilishi kerak
      if (mocks && mocks.length > 0) {
        mocks.forEach((item) => {
          // Agar item obyekt bo'lsa (MultiSelectdan kelsa) uning ID sini olamiz
          const id = item?.id || item;
          formData.append("mocks", id);
        });
      }

      // Debug uchun: FormData ichini ko'rish
      // for (var pair of formData.entries()) {
      //     console.log(pair[0]+ ', ' + pair[1]);
      // }

      let response;
      const baseUrl = "/material-templates/";

      // Payload o'rniga formData yuboramiz
      if (id) {
        response = await authAxios.patch(`${baseUrl}${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Template updated successfully!" })
        );
      } else {
        response = await authAxios.post(baseUrl, formData, {
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
      } else if (errorData?.error?.difficulty_level) {
        // Note: Backend field name typo might differ, check exact key
        errorMsg = errorData.error?.difficulty_level?.[0];
      } else if (errorData?.mocks) {
        // Ba'zan error to'g'ridan-to'g'ri array bo'lib kelishi mumkin
        errorMsg = Array.isArray(errorData.mocks)
          ? errorData.mocks[0]
          : errorData.mocks;
      }

      toast.error(errorMsg);
      console.error(e);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: mocksData } = useSWR(
    ["/mocks/", router.locale, MockCategory],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&category=${MockCategory}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const mockOptions = Array.isArray(mocksData?.results)
    ? mocksData.results
    : Array.isArray(mocksData)
    ? mocksData
    : [];

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
            error={errors?.title?.message}
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
                error={errors.category?.message}
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
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  title={intl.formatMessage({ id: "Mocks" })}
                  placeholder={intl.formatMessage({ id: "Select" })}
                  options={mockOptions}
                  error={errors.mocks?.message}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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
