import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useSWR from "swr";
import { useModal } from "@/context/modal-context";
import { ButtonSpinner } from "@/components/custom/loading";
import { Alerts, FileInput, Input } from "@/components/custom/details";
import fetcher from "@/utils/fetcher";
import { authAxios } from "@/utils/axios";
import { useParams } from "@/hooks/useParams";
import { SECTIONS_PARTS_URL, SECTIONS_URL } from "@/mock/router";
import { formatMinutesToTime, parseDurationToMinutes } from "@/utils/funcs";

export default function SectionCreator() {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const { findParams } = useParams();

  const id = findParams("id") || null;
  const type = findParams("section") || null;

  const { data: initialData, isLoading: isFetching } = useSWR(
    id ? [`/mocks/${type}/${id}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(url, { headers: { "Accept-Language": locale } }, {}, {}, true)
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setError,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: "",
      status: "DRAFT",
      duration: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        status: initialData.status,
        duration: parseDurationToMinutes(initialData.duration),
      });
    }
  }, [initialData, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);

      const payload = {
        title: values.title,
        status: values.status,
        duration: formatMinutesToTime(values.duration),
      };

      const method = id ? "put" : "post";
      const url = id ? `/mocks/${type}/${id}/` : `/mocks/${type}/`;

      const response = await authAxios[method](url, payload);

      const sectionId = id || response.data?.id || response.data?.data?.id;

      if (type === "listening" && values.file) {
        try {
          const formData = new FormData();

          const fileToUpload = values.file;

          console.log("File to upload:", fileToUpload);

          formData.append("audio_file", fileToUpload);

          await authAxios.patch(
            `/mocks/listening/${sectionId}/upload-audio/`,
            formData
          );
          console.log("Audio uploaded successfully");
        } catch (audioError) {
          console.error(
            "Audio upload error details:",
            audioError.response?.data
          );
        }
      }

      toast.success(
        intl.formatMessage({
          id: id
            ? "Update section successfully!"
            : "Create section successfully!",
        })
      );

      setTimeout(() => {
        router.push(
          id
            ? `${SECTIONS_URL}?section=${type}`
            : `${SECTIONS_PARTS_URL}?section=${type}&sectionId=${sectionId}`
        );
      }, 500);
    } catch (e) {
      // console.error("Submission Error:", e);
      toast.error(e?.response?.data?.message || "Error occurred");
    } finally {
      setReqLoading(false);
    }
  };

  if (id && isFetching)
    return (
      <div className="p-10 flex justify-center">
        <ButtonSpinner />
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
          <Input
            type={"text"}
            register={register}
            name={"title"}
            title={intl.formatMessage({ id: "Title" })}
            placeholder={"Example: Section 1"}
            id="title"
            required
            validation={{
              required: intl.formatMessage({ id: "Title is required" }),
            }}
            error={errors?.title?.message}
          />
          <Input
            type={"number"}
            register={register}
            name={"duration"}
            title={intl.formatMessage({ id: "Duration (minutes)" })}
            placeholder={"40"}
            id="duration"
            error={errors?.duration?.message}
          />

          {type === "listening" && (
            <div className="flex flex-col gap-2">
              <FileInput
                label={intl.formatMessage({ id: "Upload Audio File" })}
                name="file"
                control={control}
                rules={{
                  required: id
                    ? false
                    : intl.formatMessage({ id: "File is required" }),
                }}
                errors={errors?.file?.message}
                accept="audio/*"
              />

              {/* Edit holatida eski faylni ko'rsatish */}
              {id && initialData?.audio_file && (
                <div className="px-2 py-1 bg-gray-50 rounded-lg border border-dashed flex items-center gap-2">
                  <span className="text-[12px] text-gray-500 italic truncate max-w-[200px]">
                    Current: {initialData.audio_file.split("/").pop()}
                  </span>
                  <a
                    href={initialData.audio_file}
                    target="_blank"
                    className="text-[12px] text-main underline font-medium"
                  >
                    {intl.formatMessage({ id: "Listen" })}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="col-span-1 sm:col-span-2">
            <Alerts
              type={"info"}
              messageId={
                "If left blank, the system will automatically set the standard IELTS duration."
              }
            />
          </div>
        </div>

        <div className="flex items-start justify-end gap-4 border-t pt-5">
          <button
            type="submit"
            disabled={reqLoading}
            className="rounded-xl bg-main flex items-center justify-center text-white px-8 py-4 hover:bg-blue-800 transition-all duration-200 w-full sm:w-auto font-semibold"
          >
            {reqLoading && <ButtonSpinner />}{" "}
            {intl.formatMessage({ id: id ? "Update" : "Submit" })}
          </button>
        </div>
      </form>
    </div>
  );
}
