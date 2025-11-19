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

export default function GenerateCodeModal() {
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
  } = useForm({
    mode: "onChange",
    defaultValues: {
      role: "",
      is_guest: "",
      group: "",
    },
  });

  const watchedRole = watch("role");

  const showIsGuest = watchedRole === "STUDENT";

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const payload = {
        role: data?.role,
        is_guest: data?.is_guest == "Yes" ? true : false,
        group: data?.group,
      };

      const response = await authAxios.post(
        "/centers/invitations/create/",
        payload
      );

      toast.success(
        intl.formatMessage({ id: "Invitations code is successfully created!" })
      );

      setTimeout(() => {
        closeModal("generateCode", response?.data);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
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
        {intl.formatMessage({ id: "Generate code" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="flex flex-col gap-5">
          <Controller
            name="role"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Role" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={ForCenterAdmin}
                error={errors.role?.message}
              />
            )}
          />
          {showIsGuest && (
            <>
              <Controller
                name="is_guest"
                control={control}
                rules={{ required: intl.formatMessage({ id: "Required" }) }}
                render={({ field }) => (
                  <Select
                    {...field}
                    title={intl.formatMessage({ id: "Is guest" })}
                    placeholder={intl.formatMessage({ id: "Select" })}
                    options={YesOrNo}
                    error={errors.is_guest?.message}
                  />
                )}
              />
              <Controller
                name="group"
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
            </>
          )}
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
