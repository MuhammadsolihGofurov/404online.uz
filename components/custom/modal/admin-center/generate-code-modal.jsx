import React, { useState } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { ForCenterAdmin, YesOrNo } from "@/mock/roles";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import Select from "../../details/select";
import { Input } from "../../details";

export default function GenerateCodeModal() {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]); // Generatsiya bo'lgan kodlar uchun
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      role: "",
      count: 1, // Default 1 ta kod
    },
  });

  const watchedRole = watch("role");
  // const showIsGuest = watchedRole === "STUDENT";

  const submitFn = async (data) => {
    try {
      setReqLoading(true);
      const codes = [];
      const count = parseInt(data.count) || 1;

      const payload = {
        role: data?.role,
        // is_guest: data?.is_guest === "Yes",
      };

      for (let i = 0; i < count; i++) {
        const response = await authAxios.post(
          "/centers/invitations/create/",
          payload
        );
        codes.push(response?.data);
      }

      setGeneratedCodes(codes);
      toast.success(
        intl.formatMessage({ id: "Invitations successfully created!" })
      );
    } catch (e) {
      toast.error(e?.response?.data?.error?.detail?.[0] || "Error occurred");
    } finally {
      setReqLoading(false);
    }
  };

  const copyAllToClipboard = () => {
    const textToCopy = generatedCodes
      .map((item) => item.code || item.id)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast.info(intl.formatMessage({ id: "All codes copied!" }));
  };

  const handleFinish = () => {
    closeModal("generateCode", generatedCodes[generatedCodes.length - 1]);
  };

  const { data: groups } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  return (
    <div className="flex flex-col gap-6 p-2">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Generate code" })}
      </h1>

      {generatedCodes.length === 0 ? (
        <form
          onSubmit={handleSubmit(submitFn)}
          className="w-full flex flex-col gap-6"
        >
          <div className="flex flex-col gap-5">
            <Controller
              name="role"
              control={control}
              rules={{ required: intl.formatMessage({ id: "Required" }) }}
              render={({ field }) => (
                <Select
                  {...field}
                  title={intl.formatMessage({ id: "Role" })}
                  options={ForCenterAdmin}
                  error={errors.role?.message}
                />
              )}
            />

            {/* Miqdor inputi */}
            <Input
              type={"number"}
              register={register}
              name={"count"}
              title={intl.formatMessage({ id: "How many codes?" })}
              placeholder={"How many codes?"}
              id="count"
              required
              {...register("count", { required: true })}
              validation={{
                required: intl.formatMessage({ id: "Count is required" }),
              }}
            />

            {/* 
            {showIsGuest && (
              <>
                <Controller
                  name="is_guest"
                  control={control}
                  rules={{ required: intl.formatMessage({ id: "Required" }) }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      title={intl.formatMessage({ id: "Is guest" })}
                      options={YesOrNo}
                      error={errors.is_guest?.message}
                    />
                  )}
                />
                <Controller
                  name="group"
                  control={control}
                  rules={{ required: intl.formatMessage({ id: "Required" }) }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      title={intl.formatMessage({ id: "Groups" })}
                      options={groups}
                      error={errors.group?.message}
                    />
                  )}
                /> 
              </>
            )}*/}
          </div>

          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Generate" })
            )}
          </button>
        </form>
      ) : (
        /* Kodlar generatsiya bo'lgandan keyin ko'rinadigan qism */
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border flex flex-col gap-2 max-h-60 overflow-y-auto">
            {generatedCodes.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-1"
              >
                <span className="font-mono text-blue-600 font-bold">
                  {item.code || item.id}
                </span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={copyAllToClipboard}
              className="w-full py-3 border-2 border-gray-500 text-gray-500 rounded-xl font-semibold hover:bg-gray-300 hover:text-white transition-all"
            >
              {intl.formatMessage({ id: "Copy All" })}
            </button>
            <button
              onClick={handleFinish}
              className="rounded-xl bg-main flex items-center justify-center text-white w-full p-4 hover:bg-blue-800 transition-colors"
            >
              {intl.formatMessage({ id: "Finish" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
