import Link from "next/link";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Input } from "../details";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import axios from "@/utils/axios";
import { ButtonSpinner } from "../loading";
import { toast } from "react-toastify";
import { DASHBOARD_URL, FORGOTPASSWORDUSERNAME_URL } from "@/mock/router";
import {
  PRIVATEAUTHKEY,
  PRIVATEREFRESHKEY,
  PRIVATEUSERTYPE,
} from "@/mock/keys";

export default function LoginForm() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submitFn = async (data) => {
    const { email, password } = data;
    try {
      setReqLoading(true);

      const payload = {
        email,
        password,
      };

      const response = await axios.post("/accounts/login/", payload);

      localStorage.setItem(PRIVATEAUTHKEY, response?.data?.access);
      localStorage.setItem(PRIVATEREFRESHKEY, response?.data?.refresh);
      localStorage.setItem(PRIVATEUSERTYPE, response?.data?.user?.role);

      toast.success(intl.formatMessage({ id: "Login is successfully" }));

      setTimeout(() => {
        router.push(`${DASHBOARD_URL}`);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
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
          type={"email"}
          register={register}
          name={"email"}
          title={intl.formatMessage({ id: "Username" })}
          placeholder={"example@gmail.com"}
          id="email"
          required
          validation={{
            required: intl.formatMessage({ id: "Username is required" }),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: intl.formatMessage({
                id: "Please enter a valid email address",
              }),
            },
          }}
        />
        <Input
          type={"password"}
          register={register}
          name={"password"}
          title={intl.formatMessage({ id: "Password" })}
          placeholder={"********"}
          id="password"
          required
          validation={{
            required: intl.formatMessage({ id: "Password is requried" }),
          }}
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
