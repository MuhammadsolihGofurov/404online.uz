import Link from "next/link";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Input } from "../details";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import axios from "@/utils/axios";
import { ButtonSpinner } from "../loading";
import { toast } from "react-toastify";
import { FORGOTPASSWORDUSERNAME_URL, LOGIN_URL } from "@/mock/router";
import { PRIVATEAUTHKEY } from "@/mock/keys";

export default function RegisterForm() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setError,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      invitation_code: "",
    },
  });

  const submitFn = async (data) => {
    const { email, password, full_name, invitation_code } = data;
    try {
      setReqLoading(true);

      const payload = {
        email,
        password: isGuest ? null : password,
        full_name,
        invitation_code,
      };

      const response = await axios.post("/accounts/register/", payload);

      toast.success(intl.formatMessage({ id: "Register is successfully" }));

      setTimeout(() => {
        router.push(`/${LOGIN_URL}`);
      }, 500);
    } catch (e) {
      const error = e?.response?.data?.error;

      if (error?.invitation_code) {
        setError("invitation_code", {
          type: "manual",
          message: error?.invitation_code?.[0],
        });
      }

      if (error?.password) {
        setError("password", {
          type: "manual",
          message: error?.password?.[0],
        });
      }

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
        {intl.formatMessage({ id: "Register" })}
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
          error={errors?.email?.message}
        />
        <Input
          type={"text"}
          register={register}
          name={"full_name"}
          title={intl.formatMessage({ id: "Full name" })}
          placeholder={"John D"}
          id="full_name"
          required
          validation={{
            required: intl.formatMessage({ id: "Full name is requried" }),
          }}
          error={errors?.full_name?.[0]}
        />
        <Input
          type={"text"}
          register={register}
          name={"invitation_code"}
          title={intl.formatMessage({ id: "Invitation code" })}
          placeholder={"A4BAS@S#BGGTULS"}
          id="invitation_code"
          required
          validation={{
            required: intl.formatMessage({ id: "Invitation code is requried" }),
          }}
          error={errors?.invitation_code?.message}
        />
        
        {/* Guest Toggle */}
        <div className="flex items-center gap-2 justify-start">
          <input
            type="checkbox"
            id="is_guest"
            checked={isGuest}
            onChange={(e) => setIsGuest(e.target.checked)}
            className="rounded border-gray-300 text-main focus:ring-main w-4 h-4 cursor-pointer"
          />
          <label htmlFor="is_guest" className="text-sm text-textSecondary cursor-pointer select-none">
            {intl.formatMessage({ id: "I am a Guest (No Password required)" })}
          </label>
        </div>

        {!isGuest && (
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
            error={errors?.password?.message}
          />
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
        <p className="text-textSecondary text-base">
          You have a account:{" "}
          <Link
            href={LOGIN_URL}
            title="change password"
            className="text-main underline hover:text-blue-800 transition-colors duration-200"
          >
            login
          </Link>
        </p>
      </div>
    </form>
  );
}
