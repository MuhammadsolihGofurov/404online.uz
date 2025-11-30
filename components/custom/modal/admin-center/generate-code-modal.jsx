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
  const [createdInvitations, setCreatedInvitations] = useState(null);
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
      quantity: 1,
    },
  });

  const watchedRole = watch("role");
  const watchedIsGuest = watch("is_guest");

  const showIsGuest = watchedRole === "STUDENT";
  const showGroupInput = showIsGuest && watchedIsGuest !== "Yes";

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const isGuest = data?.is_guest == "Yes";
      const payload = {
        role: data?.role,
        is_guest: isGuest,
        group: isGuest ? null : data?.group,
        quantity: parseInt(data?.quantity),
      };

      const response = await authAxios.post(
        "/centers/invitations/create/",
        payload
      );

      toast.success(
        intl.formatMessage({ id: "Invitations code is successfully created!" })
      );

      // If multiple invitations or just one, response.data is now a list
      setCreatedInvitations(response.data);

    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
    } finally {
      setReqLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!createdInvitations) return;
    const codes = createdInvitations.map(inv => inv.code).join("\n");
    navigator.clipboard.writeText(codes);
    toast.success(intl.formatMessage({ id: "Copied to clipboard" }));
  };

  const handleClose = () => {
    closeModal("generateCode");
    // Trigger revalidation if needed, though SWR usually handles it on focus or we can mutate
    // But since we don't have mutate here easily without importing global mutate, we rely on auto revalidation
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

  if (createdInvitations) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-textPrimary text-center font-bold text-xl">
          {intl.formatMessage({ id: "Invitations Created" })}
        </h1>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
          {createdInvitations.map((inv, index) => (
            <div key={inv.id} className="flex justify-between items-center border-b last:border-0 py-2">
              <span className="text-gray-600 text-sm">{index + 1}.</span>
              <span className="font-mono font-bold text-lg text-main">{inv.code}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopyAll}
            className="rounded-xl bg-main text-white w-full p-3 hover:bg-blue-800 transition-colors duration-200 font-medium"
          >
            {intl.formatMessage({ id: "Copy All Codes" })}
          </button>
          <button
            onClick={handleClose}
            className="rounded-xl bg-gray-100 text-gray-700 w-full p-3 hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            {intl.formatMessage({ id: "Close" })}
          </button>
        </div>
      </div>
    );
  }

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
              {showGroupInput && (
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
              )}
            </>
          )}

          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-medium text-gray-700">
              {intl.formatMessage({ id: "Quantity" })}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-main"
              {...register("quantity", {
                required: true,
                min: 1,
                max: 100,
                valueAsNumber: true
              })}
            />
            {errors.quantity && (
              <span className="text-red-500 text-xs">
                {intl.formatMessage({ id: "Please enter a value between 1 and 100" })}
              </span>
            )}
          </div>

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
