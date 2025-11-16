import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { Input, Select, ToggleSwitch } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin, TrueOrFalse } from "@/mock/roles";

export default function GroupModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: initialData?.email || "",
      full_name: initialData?.full_name || "",
      role: initialData?.role || "",
      is_active: initialData?.is_active || false,
      is_approved: initialData?.is_approved || false,
      group: initialData?.group || "",
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
        response = await authAxios.patch(`/groups/${id}/`, data);
        toast.success(intl.formatMessage({ id: "Group updated successfully!" }));
      } else {
        // 🔹 Create
        response = await authAxios.post("/groups/", data);
        toast.success(
          intl.formatMessage({ id: "New group is successfully created!" })
        );
      }

      setTimeout(() => {
        closeModal("addGroup", response?.data);
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
          ? intl.formatMessage({ id: "Edit group" })
          : intl.formatMessage({ id: "Add group" })}
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
        </div>

        <div className="flex flex-col w-full">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
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
