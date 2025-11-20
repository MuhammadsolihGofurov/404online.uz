import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";
import { useParams } from "@/hooks/useParams";
import { getPartNumbers } from "@/utils/funcs";
import { Dynamic3PartsForm } from "./details";
import { MOCK_CONFIG } from "@/mock/data";
import { MOCKS_CREATE_FOURTH_STEP_URL } from "@/mock/router";

export default function ThirdStepForms() {
  const intl = useIntl();
  const [reqLoading, setReqLoading] = useState(false);
  const { findParams } = useParams();
  const router = useRouter();

  const MockType = findParams("mock_type");
  const MockId = findParams("mock_id");

  // Default values parts soni mockType ga qarab
  const defaultParts = useMemo(() => {
    const config = MOCK_CONFIG[MockType] || { parts: 1, fields: [] };
    return Array.from({ length: config.parts }, (_, i) => ({
      part_number: i + 1, // part_number hech qachon indexga bog‘lanmaydi
      instructions: "",
      images: [],
      audio_file: null,
    }));
  }, [MockType]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { parts: defaultParts },
  });

  const partOptions = useMemo(() => getPartNumbers(MockType), [MockType]);

  const submitFn = async (data) => {
    console.log("Submitting data:", data);
    try {
      setReqLoading(true);

      for (let part of data.parts) {
        if (!part) continue;

        const formData = new FormData();
        formData.append("mock", MockId);
        formData.append("instructions", part.instructions || "");
        formData.append("part_number", part.part_number); // original part_number

        if (part.audio_file instanceof File) {
          formData.append("audio_file", part.audio_file);
        }

        // 1️⃣ Send section
        const response = await authAxios.post("/mock-sections/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const sectionId = response?.data?.id;

        // 2️⃣ Send images if any
        if (part.images?.length) {
          const imagesForm = new FormData();
          imagesForm.append("section_id", sectionId);
          Array.from(part.images).forEach((img) => {
            imagesForm.append("images", img);
          });

          await authAxios.post(
            "/mock-section-images/bulk-upload/",
            imagesForm,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }
      }

      toast.success("Success!");
      setTimeout(() => {
        router.push(
          `${MOCKS_CREATE_FOURTH_STEP_URL}?mock_id=${MockId}&mock_type=${MockType}`
        );
      });
    } catch (e) {
      console.error(e.response?.data || e.message);
      toast.error(
        e?.response?.data?.error?.detail?.[0] ||
          intl.formatMessage({ id: "Something went wrong" })
      );
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitFn)} className="flex flex-col gap-5">
      <Dynamic3PartsForm
        mockType={MockType}
        control={control}
        register={register}
        errors={errors}
        intl={intl}
        partOptions={partOptions}
      />

      <div className="w-full flex items-center justify-end">
        <button
          type="submit"
          className="rounded-xl bg-main flex items-center justify-center text-white p-4 hover:bg-blue-800 transition-colors duration-200"
        >
          {reqLoading ? (
            <ButtonSpinner />
          ) : (
            intl.formatMessage({ id: "Submit" })
          )}
        </button>
      </div>
    </form>
  );
}
