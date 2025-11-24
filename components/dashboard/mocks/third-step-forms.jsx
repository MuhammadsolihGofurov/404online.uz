import React, { useEffect, useMemo, useState } from "react";
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
import {
  MOCKS_CREATE_FOURTH_STEP_URL,
  MOCKS_VIEW_URL,
} from "@/mock/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import Link from "next/link";

export default function ThirdStepForms() {
  const intl = useIntl();
  const [reqLoading, setReqLoading] = useState(false);
  const { findParams } = useParams();
  const router = useRouter();

  const MockType = findParams("mock_type");
  const MockId = findParams("mock_id");
  const category = findParams("category");
  const mode = findParams("mode");
  const isEditMode = mode === "edit";

  // Default values parts soni mockType ga qarab
  const defaultParts = useMemo(() => {
    const config = MOCK_CONFIG[MockType] || { parts: 1, fields: [] };
    return Array.from({ length: config.parts }, (_, i) => ({
      part_number: i + 1, // part_number hech qachon indexga bog‘lanmaydi
      instructions: "",
      images: [],
      audio_file: null,
      section_id: null,
    }));
  }, [MockType]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: { parts: defaultParts },
  });

  const partOptions = useMemo(() => getPartNumbers(MockType), [MockType]);

  const { data: existingMock } = useSWR(
    MockId ? [`/mocks/${MockId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      ),
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (!existingMock?.sections?.length) return;
    const formattedSections = [...existingMock.sections]
      .sort((a, b) => (a.part_number || 0) - (b.part_number || 0))
      .map((section) => ({
        section_id: section.id,
        part_number: section.part_number,
        instructions: section.instructions || "",
        images:
          section.images?.map((img) => ({
            id: img.id,
            preview: img.image,
            isExisting: true,
          })) || [],
        audio_file: null,
      }));
    reset({ parts: formattedSections });
  }, [existingMock, reset]);

  const submitFn = async (data) => {
    console.log("Submitting data:", data);
    try {
      setReqLoading(true);

      for (let part of data.parts) {
        if (!part) continue;

        const formData = new FormData();
        const sectionId = part.section_id;
        const isUpdate = Boolean(sectionId);
        if (!isUpdate) {
          formData.append("mock", MockId);
        }
        formData.append("instructions", part.instructions || "");
        formData.append("part_number", part.part_number); // original part_number

        if (part.audio_file instanceof File) {
          formData.append("audio_file", part.audio_file);
        }

        let persistedSectionId = sectionId;
        if (isUpdate) {
          const response = await authAxios.patch(
            `/mock-sections/${persistedSectionId}/`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          persistedSectionId = response?.data?.id || persistedSectionId;
        } else {
          const response = await authAxios.post("/mock-sections/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          persistedSectionId = response?.data?.id;
        }

        // 2️⃣ Send images if any
        const newImages =
          part.images?.filter((img) => img.file instanceof File) || [];

        if (newImages.length) {
          const imagesForm = new FormData();
          imagesForm.append("section_id", persistedSectionId);
          newImages.forEach((img) => {
            imagesForm.append("images", img.file);
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
        const params = new URLSearchParams({
          mock_id: MockId,
          mock_type: MockType,
        });
        if (category) {
          params.append("category", category);
        }
        if (isEditMode) {
          params.append("mode", "edit");
        }
        router.push(`${MOCKS_CREATE_FOURTH_STEP_URL}?${params.toString()}`);
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

  const handleExistingImageDelete = async (image) => {
    if (!image?.id) return false;
    try {
      await authAxios.delete(`/mock-section-images/${image.id}/`);
      toast.success("Image removed");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail ||
          intl.formatMessage({ id: "Failed to delete image" })
      );
      return false;
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
        onDeleteExistingImage={handleExistingImageDelete}
      />

      <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:justify-between">
        {isEditMode && (
          <Link
            href={`${MOCKS_VIEW_URL}?mock_id=${MockId}`}
            className="text-sm font-semibold text-main hover:underline"
          >
            Back to Mock Details
          </Link>
        )}
        <button
          type="submit"
          className="flex items-center justify-center p-4 text-white transition-colors duration-200 rounded-xl bg-main hover:bg-blue-800 sm:ml-auto"
        >
          {reqLoading ? (
            <ButtonSpinner />
          ) : (
            "Save & Continue to Questions"
          )}
        </button>
      </div>
    </form>
  );
}
