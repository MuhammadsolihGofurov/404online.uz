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

  // Helper function to upload images in chunks with retry
  const uploadImagesWithRetry = async (sectionId, images, maxRetries = 3) => {
    const CHUNK_SIZE = 5; // Upload 5 images at a time
    const chunks = [];
    
    // Split images into chunks
    for (let i = 0; i < images.length; i += CHUNK_SIZE) {
      chunks.push(images.slice(i, i + CHUNK_SIZE));
    }

    // Upload each chunk with retry logic
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const imagesForm = new FormData();
          imagesForm.append("section_id", sectionId);
          chunk.forEach((img) => {
            imagesForm.append("images", img.file);
          });

          await authAxios.post(
            "/mock-section-images/bulk-upload/",
            imagesForm,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 60000, // 60 seconds timeout for chunk upload
            }
          );
          
          // Success - move to next chunk
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            toast.warning(
              intl.formatMessage(
                { id: "Retrying image upload... (Attempt {attempt}/{maxRetries})" },
                { attempt, maxRetries }
              )
            );
          }
        }
      }
      
      // If all retries failed for this chunk, throw error
      if (lastError) {
        throw new Error(
          `Failed to upload images after ${maxRetries} attempts: ${lastError.message}`
        );
      }
    }
  };

  // Helper function to find existing section by mock and part_number
  const findExistingSection = async (mockId, partNumber) => {
    try {
      const response = await authAxios.get("/mock-sections/", {
        params: {
          mock: mockId,
          part_number: partNumber,
        },
      });
      const sections = response.data?.results || response.data || [];
      return sections.find(s => s.part_number === partNumber) || null;
    } catch (error) {
      console.error("Error finding existing section:", error);
      return null;
    }
  };

  const submitFn = async (data) => {
    console.log("Submitting data:", data);
    try {
      setReqLoading(true);

      for (let part of data.parts) {
        if (!part) continue;

        const formData = new FormData();
        let sectionId = part.section_id;
        let isUpdate = Boolean(sectionId);

        // If no section_id, check if section already exists (handles duplicate creation)
        if (!isUpdate) {
          const existingSection = await findExistingSection(MockId, part.part_number);
          if (existingSection) {
            sectionId = existingSection.id;
            isUpdate = true;
            toast.info(
              intl.formatMessage(
                { id: "Section for Part {part} already exists. Updating instead." },
                { part: part.part_number }
              )
            );
          } else {
            formData.append("mock", MockId);
          }
        }
        
        formData.append("instructions", part.instructions || "");
        formData.append("part_number", part.part_number);

        if (part.audio_file instanceof File) {
          formData.append("audio_file", part.audio_file);
        }

        let persistedSectionId = sectionId;
        try {
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
            
            console.log(`Section creation response for Part ${part.part_number}:`, {
              status: response?.status,
              sectionId: persistedSectionId,
              fullResponse: response?.data,
            });
            
            // Validate that section was created successfully
            if (!persistedSectionId) {
              console.error("Section creation failed - no ID returned:", response?.data);
              throw new Error(
                `Failed to create section for Part ${part.part_number}. Server did not return section ID. Response: ${JSON.stringify(response?.data)}`
              );
            }
          }
        } catch (sectionError) {
          // Handle duplicate section error (unique constraint)
          if (
            sectionError.response?.status === 400 &&
            sectionError.response?.data?.error?.non_field_errors?.some(
              (msg) => msg.includes("unique") || msg.includes("mock, part_number")
            )
          ) {
            // Try to find and update existing section
            const existingSection = await findExistingSection(MockId, part.part_number);
            if (existingSection) {
              persistedSectionId = existingSection.id;
              const updateResponse = await authAxios.patch(
                `/mock-sections/${persistedSectionId}/`,
                formData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                }
              );
              persistedSectionId = updateResponse?.data?.id || persistedSectionId;
              toast.info(
                intl.formatMessage(
                  { id: "Section for Part {part} already exists. Updated successfully." },
                  { part: part.part_number }
                )
              );
            } else {
              throw sectionError; // Re-throw if we can't find existing section
            }
          } else {
            throw sectionError; // Re-throw other errors
          }
        }

        // Validate section ID before uploading images
        if (!persistedSectionId) {
          throw new Error(
            `Cannot upload images: Section for Part ${part.part_number} was not created/updated successfully.`
          );
        }

        // 2️⃣ Send images if any (with chunking and retry)
        const newImages =
          part.images?.filter((img) => img.file instanceof File) || [];

        if (newImages.length) {
          toast.info(
            intl.formatMessage(
              { id: "Uploading {count} images for Part {part}..." },
              { count: newImages.length, part: part.part_number }
            )
          );
          
          await uploadImagesWithRetry(persistedSectionId, newImages);
        }
      }

      // Verify sections were created by fetching the mock
      try {
        const verifyResponse = await authAxios.get(`/mocks/${MockId}/`);
        const createdSections = verifyResponse?.data?.sections || [];
        
        if (createdSections.length === 0) {
          console.warn("Warning: Sections were created but not found in mock response");
          toast.warning(
            intl.formatMessage({ id: "Sections created but verification failed. Please refresh the page." })
          );
        } else {
          toast.success(
            intl.formatMessage(
              { id: "Success! {count} section(s) created." },
              { count: createdSections.length }
            )
          );
        }
      } catch (verifyError) {
        console.error("Error verifying sections:", verifyError);
        // Continue anyway - sections might still be created
        toast.success("Success!");
      }

      // Small delay to ensure backend has processed everything
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
      }, 500); // Small delay to ensure backend processing
    } catch (e) {
      console.error(e.response?.data || e.message);
      const errorMessage =
        e?.response?.data?.error?.non_field_errors?.[0] ||
        e?.response?.data?.error?.detail?.[0] ||
        e?.message ||
        intl.formatMessage({ id: "Something went wrong" });
      toast.error(errorMessage);
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
