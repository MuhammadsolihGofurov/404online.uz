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
import Select from "../../details/select";

export default function ChangeGroupMemberModal({ initialData, assistant_id }) {
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
      user_id: initialData?.user_id || "",
      to_group_id: initialData?.to_group_id || "",
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const response = await authAxios.post(
        "/group-memberships/move-student/",
        data
      );

      toast.success(
        intl.formatMessage({
          id: "Student group is successfully changed!",
        })
      );

      setTimeout(() => {
        closeModal("changeGroupMember", response?.data);
      }, 500);
    } catch (e) {
        // const error = e?.response?.data?.error?.detail;
      toast.error(e?.response?.data?.error?.detail);
    } finally {
      setReqLoading(false);
    }
  };

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
        {intl.formatMessage({ id: "Change membership" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="flex flex-col gap-5">
          <Controller
            name="to_group_id"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Groups" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={groups}
                error={errors.to_group_id?.message}
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
