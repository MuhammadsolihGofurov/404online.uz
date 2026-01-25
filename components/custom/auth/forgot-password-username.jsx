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

export default function ForgotPasswordUsername() {
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
      old_password: "",
      new_password: "",
    },
  });

  const submitFn = async (data) => {
    const { username } = data;
    try {
      setReqLoading(true);

      const payload = {
        username,
      };

      const response = await axios.post("/accounts/password/reset/", payload);

      // localStorage.setItem(REGISTERPHONENUMBER, phone_number);

      toast.success(
        intl.formatMessage({ id: "We have sent a link to your email. Please check your email" })
      );

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
        {intl.formatMessage({ id: "Change Password" })}
      </h1>
      <div className="flex flex-col gap-5">
        <Input
          type={"email"}
          register={register}
          name={"username"}
          title={intl.formatMessage({ id: "Username" })}
          placeholder={"example@gmail.com"}
          id="username"
          required
          validation={{
            required: intl.formatMessage({ id: "Username is requried" }),
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
        {/* <p className="text-textSecondary text-base">
          We will send link to your email.
        </p> */}
      </div>
    </form>
  );
}
