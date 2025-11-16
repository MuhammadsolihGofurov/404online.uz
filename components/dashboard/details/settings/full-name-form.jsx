import { Input } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { authAxios } from "@/utils/axios";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function FullNameForm({
  old_full_name,
  role,
  description,
  center_id,
  page,
  old_center_name,
}) {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setError,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      full_name: old_full_name || "",
      name: old_center_name || "",
      description: description || "",
    },
  });
  const isMyCenterPage = page === "myCenter";

  useEffect(() => {
    setValue("full_name", old_full_name);
    if (page === "myCenter") {
      setValue("name", old_center_name);
      setValue("description", description);
    }
  }, [old_full_name, role, description, old_center_name]);

  const submitFn = async (data) => {
    const url = isMyCenterPage
      ? `/centeradmin/center/${center_id}/`
      : "/accounts/me/";
    const { full_name, name, description } = data;

    const UserData = { full_name };
    const CenterData = { name, description };

    try {
      setReqLoading(true);

      await authAxios.patch(url, isMyCenterPage ? CenterData : UserData);

      toast.success(
        intl.formatMessage({ id: "Details is successfully updated!" })
      );
    } catch (e) {
      const error = e?.response?.data;
      toast.error(error?.message);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitFn)}
      className="flex flex-col items-start gap-5 max-w-3xl"
    >
      <h2 className="text-textPrimary font-semibold text-base">
        {intl.formatMessage({ id: "Details update" })}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        {isMyCenterPage ? (
          <>
            <Input
              type={"text"}
              register={register}
              name={"name"}
              title={intl.formatMessage({ id: "Center name" })}
              placeholder={"Center"}
              id="name"
              required
              validation={{
                required: intl.formatMessage({ id: "Center name is requried" }),
              }}
            />
            <Input
              type={"text"}
              register={register}
              name={"description"}
              title={intl.formatMessage({ id: "Description" })}
              placeholder={"Text"}
              id="description"
              required
              validation={{
                required: intl.formatMessage({ id: "Description is requried" }),
              }}
            />
          </>
        ) : (
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
          />
        )}
      </div>
      <button
        type="submit"
        className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
      >
        {reqLoading ? <ButtonSpinner /> : intl.formatMessage({ id: "Update" })}
      </button>
    </form>
  );
}
