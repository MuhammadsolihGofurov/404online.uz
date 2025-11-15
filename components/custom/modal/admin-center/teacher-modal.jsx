import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { Input, Select } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin } from "@/mock/roles";

export default function TeacherModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      let response;
      if (id) {
        // 🔹 Edit
        response = await authAxios.put(`/users/${id}/`, data);
        toast.success(
          intl.formatMessage({ id: "Teacher updated successfully!" })
        );
      } else {
        // 🔹 Create
        response = await authAxios.post("/users/", data);
        toast.success(
          intl.formatMessage({ id: "New teacher is successfully created!" })
        );
      }

      setTimeout(() => {
        closeModal("addTeacher", response?.data);
      }, 500);
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0]);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {id
          ? intl.formatMessage({ id: "Edit teacher" })
          : intl.formatMessage({ id: "Add teacher" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-2 gap-5">
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
            type="text"
            register={register}
            name="full_name"
            title={intl.formatMessage({ id: "Full name" })}
            placeholder="John D"
            required
            validation={{
              required: intl.formatMessage({ id: "Full name is required" }),
            }}
          />
          <Select
            name="role"
            title={intl.formatMessage({ id: "Role" })}
            placeholder={intl.formatMessage({ id: "Select" })}
            options={ForCenterAdmin}
            register={register}
            validation={{ required: "Required" }}
            error={errors.country?.message}
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
            ) : id ? (
              intl.formatMessage({ id: "Update" })
            ) : (
              intl.formatMessage({ id: "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
