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

export default function AssignUserToDocumentsModal({
  old_students,
  old_groups,
  id,
}) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      assigned_students: old_students || [],
      assigned_groups: old_groups || [],
    },
  });

  useEffect(() => {
    if (old_students || old_groups)
      reset({ assigned_students: old_students, assigned_groups: old_groups });
  }, [old_groups, old_students, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const payload = {
        assigned_groups: data?.assigned_groups?.map((item) => item?.id),
        assigned_students: data?.assigned_students?.map((item) => item?.id),
      };

      const response = await authAxios.patch(`/materials/${id}/`, payload);

      toast.success(
        intl.formatMessage({
          id: "Document is successfully assigned to user!",
        })
      );

      setTimeout(() => {
        closeModal("assignDocumentToUser", response?.data);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: users } = useSWR(["/users/", router.locale], ([url, locale]) =>
    fetcher(
      `${url}?page_size=all&role=STUDENT`,
      {
        headers: {
          "Accept-Language": locale,
        },
      },
      {},
      true
    )
  );

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
            name="assigned_groups"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            defaultValue={old_groups || []}
            render={({ field }) => (
              <MultiSelect
                {...field}
                title={intl.formatMessage({ id: "Groups" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={groups || []}
                error={errors.assigned_groups?.message}
                value={field.value || []}
                onChange={(val) => field.onChange(val)}
              />
            )}
          />
          <Controller
            name="assigned_students"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            defaultValue={old_students || []}
            render={({ field }) => (
              <MultiSelect
                {...field}
                title={intl.formatMessage({ id: "Users" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={users || []}
                error={errors.assigned_students?.message}
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
