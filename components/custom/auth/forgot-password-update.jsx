import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Input } from "../details";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import axios from "@/utils/axios";
import { ButtonSpinner } from "../loading";
import { toast } from "react-toastify";
import { FORGOTPASSWORDUSERNAME_URL, LOGIN_URL } from "@/mock/router";

export default function ForgotPasswordUpdate() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const newPassword = watch("new_password");

  // Get uid and token from URL query parameters
  const { uid, token } = router.query;

  useEffect(() => {
    // Validate that uid and token exist
    if (router.isReady && (!uid || !token)) {
      toast.error(intl.formatMessage({ id: "Invalid or missing reset link" }));
      router.push(FORGOTPASSWORDUSERNAME_URL);
    }
  }, [router.isReady, uid, token, router, intl]);

  const submitFn = async (data) => {
    const { new_password } = data;
    try {
      setReqLoading(true);

      const payload = {
        uid,
        token,
        new_password,
      };

      const response = await axios.post(
        "/accounts/password/reset/confirm/",
        payload
      );

      toast.success(intl.formatMessage({ id: "Password reset successful. Please login with your new password." }));

      setTimeout(() => {
        router.push(LOGIN_URL);
      }, 1500);
    } catch (e) {
      console.error(e);
      const errorMessage = e?.response?.data?.detail 
        || e?.response?.data?.token?.[0]
        || e?.response?.data?.uid?.[0]
        || e?.response?.data?.new_password?.[0]
        || intl.formatMessage({ id: "Failed to reset password. Please try again." });
      toast.error(errorMessage);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitFn)}
      className="w-full flex flex-col gap-8 text-center font-roboto"
    >
      <h1 className="text-2xl font-semibold text-textPrimary capitalize">
        {intl.formatMessage({ id: "Reset Password" })}
      </h1>
      <div className="flex flex-col gap-5">
        <Input
          type={"password"}
          register={register}
          name={"new_password"}
          title={intl.formatMessage({ id: "New Password" })}
          placeholder={"********"}
          id="new_password"
          required
          validation={{
            required: intl.formatMessage({ id: "New password is required" }),
            minLength: {
              value: 6,
              message: intl.formatMessage({ id: "Password must be at least 6 characters" }),
            },
          }}
          error={errors.new_password?.message}
        />
        <Input
          type={"password"}
          register={register}
          name={"confirm_password"}
          title={intl.formatMessage({ id: "Confirm Password" })}
          placeholder={"********"}
          id="confirm_password"
          required
          validation={{
            required: intl.formatMessage({ id: "Please confirm your password" }),
            validate: (value) =>
              value === newPassword ||
              intl.formatMessage({ id: "Passwords do not match" }),
          }}
          error={errors.confirm_password?.message}
        />
      </div>
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={reqLoading || !uid || !token}
          className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reqLoading ? (
            <ButtonSpinner />
          ) : (
            intl.formatMessage({ id: "Reset Password" })
          )}
        </button>
        <p className="text-textSecondary text-base">
          {intl.formatMessage({ id: "Remember your password?" })}{" "}
          <Link
            href={LOGIN_URL}
            title="login"
            className="text-main underline hover:text-blue-800 transition-colors duration-200"
          >
            {intl.formatMessage({ id: "Login" })}
          </Link>
        </p>
      </div>
    </form>
  );
}
