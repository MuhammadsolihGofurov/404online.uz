import Link from "next/link";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Input } from "../details";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import axios from "@/utils/axios";
import { ButtonSpinner } from "../loading";
import { toast } from "react-toastify";
import { FORGOTPASSWORDUSERNAME_URL } from "@/mock/router";

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
      username: "",
    },
  });

  const oldPassword = watch("old_password");
  const newPassword = watch("new_password");

  const submitFn = async (data) => {
    const { username, password } = data;
    try {
      setReqLoading(true);

      //uid va tokenni routerdan olish kerak

      const payload = {
        uid: "",
        token: "",
        username,
      };

      const response = await axios.post(
        "/accounts/password/reset/confirm",
        payload
      );

      // localStorage.setItem(REGISTERPHONENUMBER, phone_number);

      toast.success(intl.formatMessage({ id: "Login is successfully" }));

      // setTimeout(() => {
      //   router.push(`/${FillNewPasswordUrl}`);
      // }, 500);
    } catch (e) {
      // console.error(e);
      toast.error(e?.response?.data?.message);
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
        {intl.formatMessage({ id: "login" })}
      </h1>
      <div className="flex flex-col gap-5">
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
            validate: (value) =>
              value === oldPassword ||
              intl.formatMessage({ id: "Old password is not equal" }),
          }}
          error={errors.new_password?.message}
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
        <p className="text-textSecondary text-base">
          Forgot your password:{" "}
          <Link
            href={FORGOTPASSWORDUSERNAME_URL}
            title="change password"
            className="text-main underline hover:text-blue-800 transition-colors duration-200"
          >
            change password
          </Link>
        </p>
      </div>
    </form>
  );
}
