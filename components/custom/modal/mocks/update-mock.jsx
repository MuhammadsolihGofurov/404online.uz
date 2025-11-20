import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { Input, Select } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin } from "@/mock/roles";

export default function UpdateMockModal({ id, initialData }) {
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
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const response = await authAxios.patch(`/mocks/${id}/`, data);
      toast.success(intl.formatMessage({ id: "Mock updated successfully!" }));

      setTimeout(() => {
        closeModal("updateMock", response?.data);
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
        {intl.formatMessage({ id: "Edit mock" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <Input
          type="text"
          register={register}
          name="title"
          title={intl.formatMessage({ id: "Title" })}
          placeholder="title"
          required
          validation={{
            required: intl.formatMessage({ id: "Title is required" }),
          }}
        />
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Update" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
