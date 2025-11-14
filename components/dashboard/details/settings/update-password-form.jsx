import { Input } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { authAxios } from "@/utils/axios";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function UpdatePasswordForm() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setError,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      old_password: "",
      new_password: "",
    },
  });

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      await authAxios.put("/accounts/password/update/", data);

      toast.success(
        intl.formatMessage({ id: "Password is successfully updated!" })
      );

      reset();
    } catch (e) {
      const error = e?.response?.data;
      toast.error(error?.message);
      toast.error(error?.error?.non_field_errors?.[0]);
      toast.error(error?.error?.non_field_errors?.[1]);

      if (error?.error?.non_field_errors?.[0]) {
        setError("new_password", {
          type: "manual",
          message: error?.error?.non_field_errors?.[0],
        });
      }
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitFn)}
      className="flex flex-col items-start gap-5 max-w-3xl"
    >
      <h2 className="text-textPrimary font-semibold text-base">
        {intl.formatMessage({ id: "Password update" })}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        <Input
          type={"password"}
          register={register}
          name={"old_password"}
          title={intl.formatMessage({ id: "Old password" })}
          placeholder={"********"}
          id="Old Password"
          required
          validation={{
            required: intl.formatMessage({ id: "Old password is requried" }),
          }}
          error={errors.old_password?.message}
        />
        <Input
          type={"password"}
          register={register}
          name={"new_password"}
          title={intl.formatMessage({ id: "New password" })}
          placeholder={"********"}
          id="New password"
          required
          validation={{
            required: intl.formatMessage({ id: "New password is requried" }),
          }}
          error={errors?.new_password?.message}
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
      >
        {reqLoading ? <ButtonSpinner /> : intl.formatMessage({ id: "Update" })}
      </button>
    </form>
  );
}
