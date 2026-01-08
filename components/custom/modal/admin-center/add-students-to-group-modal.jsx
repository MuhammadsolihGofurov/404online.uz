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
import MultiSelect from "../../details/multi-select";

export default function AddStudentsToGroupModal({ group_id, userType }) {
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
      members: [],
    },
  });

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const payload = {
        group_id: group_id,
        members: data.members.map((user) => ({
          user_id: user.id,
          role_in_group: userType,
        })),
      };

      const response = await authAxios.post(
        `/group-memberships/bulk-add/`,
        payload
      );
      toast.success(intl.formatMessage({ id: "Group updated successfully!" }));

      setTimeout(() => {
        closeModal("addStudentsToGroupModal", response?.data);
      }, 500);
    } catch (e) {
      const errorMessage =
        e?.response?.data?.error?.detail?.[0] || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: users } = useSWR(["/users/", router.locale], ([url, locale]) =>
    fetcher(
      `${url}?page_size=all&role=${userType}`,
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
        {userType === "STUDENT" ? "Add students" : "Add assistants"}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="flex flex-col gap-5">
          <Controller
            name="members"
            control={control}
            render={({ field }) => (
              <MultiSelect
                {...field}
                title={intl.formatMessage({ id: "Users" })}
                options={users || []}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex flex-col w-full">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading && <ButtonSpinner />}{" "}
            {intl.formatMessage({ id: "Add" })}
          </button>
        </div>
      </form>
    </div>
  );
}
