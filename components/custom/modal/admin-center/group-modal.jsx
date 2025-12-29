import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { Input } from "../../details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin } from "@/mock/roles";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import Select from "../../details/select";
import useSWR from "swr";

export default function GroupModal({ id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

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
      teacher_id: initialData?.teacher_id || initialData?.teacher || "",
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
        toast.success(
          intl.formatMessage({ id: "Group updated successfully!" })
        );
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

  const { data: teachers } = useSWR(
    ["/users/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&role=TEACHER`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

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
            type={"text"}
            register={register}
            name={"name"}
            title={intl.formatMessage({ id: "Name" })}
            placeholder={"Group name"}
            id="name"
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
            placeholder="Describe group"
            required
            validation={{
              required: intl.formatMessage({ id: "Description is required" }),
            }}
          />
          <Controller
            name="teacher_id"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Teacher" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={teachers}
                error={errors.teacher_id?.message}
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
