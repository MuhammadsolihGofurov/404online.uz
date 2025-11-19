import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin, YesOrNo } from "@/mock/roles";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";

export default function AssignToTeacherModal({ initialData, assistant_id }) {
  const intl = useIntl();
  const { closeModal, openModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    control,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      teacher_id: initialData || [],
    },
  });

  useEffect(() => {
    if (initialData) reset({ teacher_id: initialData });
  }, [initialData, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const payload = {
        ...data,
        assistant_id: assistant_id,
      };

      console.error(payload)

      const response = await authAxios.post(
        "/assistant-teacher/link/",
        payload
      );

      toast.success(
        intl.formatMessage({
          id: "Assistant is successfully assigned to teacher!",
        })
      );

      setTimeout(() => {
        closeModal("assignToTeacher", response?.data);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: teachers } = useSWR(
    ["/users/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&role=TEACHER`,
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
        {intl.formatMessage({ id: "Assign to teacher" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="flex flex-col gap-5">
          <Controller
            name="teacher_id"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            defaultValue={initialData || []}
            render={({ field }) => (
              <MultiSelect
                {...field}
                title={intl.formatMessage({ id: "Teacher" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={teachers || []}
                error={errors.teacher_id?.message}
                value={field.value || []}
                onChange={(val) => field.onChange(val)}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200"
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
