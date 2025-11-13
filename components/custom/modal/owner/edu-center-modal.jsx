import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { Input } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";

export default function EduCenterModal({ id, initialData }) {
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
        response = await authAxios.put(`/owner/centers/${id}/`, data);
        toast.success(
          intl.formatMessage({ id: "Center updated successfully!" })
        );
      } else {
        // 🔹 Create
        response = await authAxios.post("/owner/centers/", data);
        toast.success(
          intl.formatMessage({ id: "New Center is successfully created!" })
        );
      }

      setTimeout(() => {
        closeModal("createEduCenter", response?.data);
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
          ? intl.formatMessage({ id: "Edit center" })
          : intl.formatMessage({ id: "Add center" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="flex flex-col gap-5">
          <Input
            type="text"
            register={register}
            name="name"
            title={intl.formatMessage({ id: "Name" })}
            placeholder="Edu center name"
            required
            validation={{
              required: intl.formatMessage({ id: "Name is required" }),
            }}
          />
          <Input
            type="text"
            register={register}
            name="description"
            title={intl.formatMessage({ id: "Description" })}
            placeholder="IELTS edu center"
            required
            validation={{
              required: intl.formatMessage({ id: "Description is required" }),
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
