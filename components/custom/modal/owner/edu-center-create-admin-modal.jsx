import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Input } from "../../details";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { authAxios } from "@/utils/axios";
import { ButtonSpinner } from "../../loading";
import { useModal } from "@/context/modal-context";

export default function EduCenterCreateAdminModal({ id }) {
  const intl = useIntl();
  const router = useRouter();
  const { closeModal } = useModal();
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
      email: "",
      full_name: "",
      password: "",
    },
  });

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const response = await authAxios.post(
        `/centers/${id}/admin/create/`,
        data
      );

      toast.success(intl.formatMessage({ id: "Create Admin successfully!" }));

      setTimeout(() => {
        closeModal("eduCenterCreateAdmin", null);
      }, 500);
    } catch (e) {
      const error = e?.response?.data?.error;

      if (error?.email) {
        setError("email", {
          type: "manual",
          message: error?.email?.[0],
        });
      }

      toast.error(e?.response?.data?.message);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Add admin account" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
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
            error={errors?.full_name?.message}
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
            error={errors?.password?.message}
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
