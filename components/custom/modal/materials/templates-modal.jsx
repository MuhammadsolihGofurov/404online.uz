import React, { useState, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";
import Select from "../../details/select";
import { MOCK_TEMPLATES, TEMPLATE_D_LEVEL } from "@/mock/data";
import { Input, ToggleSwitch } from "../../details";

// ============================================================================
// CLIENT-SIDE VALIDATION HELPER
// ============================================================================

/**
 * Validate Material Template selection according to business rules.
 * 
 * Business Rules:
 * 1. MUST contain exactly 3 mocks
 * 2. MUST have distinct types: 1 LISTENING, 1 READING, 1 WRITING (no duplicates)
 * 3. All mocks MUST match the template category
 * 
 * @param {Array} selectedMocks - Array of mock objects with { id, title, mock_type, category }
 * @param {String} templateCategory - Template category ("EXAM_TEMPLATE" or "PRACTICE_TEMPLATE")
 * @returns {Object} { isValid: boolean, error: string | null }
 */
function validateTemplateSelection(selectedMocks, templateCategory) {
  // Only validate for EXAM_TEMPLATE and PRACTICE_TEMPLATE
  if (!templateCategory || !["EXAM_TEMPLATE", "PRACTICE_TEMPLATE"].includes(templateCategory)) {
    return { isValid: true, error: null };
  }

  // ========================================================================
  // RULE 1: Must have exactly 3 mocks
  // ========================================================================
  if (!selectedMocks || selectedMocks.length === 0) {
    return {
      isValid: false,
      error: "Please select mocks for the template."
    };
  }

  if (selectedMocks.length < 3) {
    return {
      isValid: false,
      error: `You selected ${selectedMocks.length} mock(s). Please select exactly 3 mocks (1 Listening, 1 Reading, 1 Writing).`
    };
  }

  if (selectedMocks.length > 3) {
    return {
      isValid: false,
      error: `You selected ${selectedMocks.length} mocks. Please select exactly 3 mocks (1 Listening, 1 Reading, 1 Writing).`
    };
  }

  // ========================================================================
  // RULE 2: Must have 1 LISTENING, 1 READING, 1 WRITING (no duplicates)
  // ========================================================================
  const mockTypeCounts = {};
  const mockTypes = [];

  selectedMocks.forEach((mock) => {
    const type = mock.mock_type;
    mockTypes.push(type);
    mockTypeCounts[type] = (mockTypeCounts[type] || 0) + 1;
  });

  // Required types
  const requiredTypes = ["LISTENING", "READING", "WRITING"];
  const presentTypes = new Set(mockTypes);
  const missingTypes = requiredTypes.filter(type => !presentTypes.has(type));
  const duplicateTypes = Object.entries(mockTypeCounts)
    .filter(([type, count]) => count > 1)
    .map(([type, count]) => ({ type, count }));

  // Check for missing types
  if (missingTypes.length > 0) {
    const missingDisplay = missingTypes.map(type => {
      switch(type) {
        case "LISTENING": return "Listening";
        case "READING": return "Reading";
        case "WRITING": return "Writing";
        default: return type;
      }
    }).join(", ");

    return {
      isValid: false,
      error: `Missing required mock type(s): ${missingDisplay}. Please select exactly 1 Listening, 1 Reading, and 1 Writing mock.`
    };
  }

  // Check for duplicates
  if (duplicateTypes.length > 0) {
    const duplicateDisplay = duplicateTypes.map(({ type, count }) => {
      const typeName = type === "LISTENING" ? "Listening" : 
                       type === "READING" ? "Reading" : 
                       type === "WRITING" ? "Writing" : type;
      return `${typeName} (${count} selected)`;
    }).join(", ");

    return {
      isValid: false,
      error: `You selected duplicate mock types: ${duplicateDisplay}. Please select exactly 1 Listening, 1 Reading, and 1 Writing mock.`
    };
  }

  // ========================================================================
  // RULE 3: All mocks must match template category
  // ========================================================================
  const mismatchedMocks = selectedMocks.filter(
    mock => mock.category && mock.category !== templateCategory
  );

  if (mismatchedMocks.length > 0) {
    const mismatchedTitles = mismatchedMocks
      .map(mock => `"${mock.title}" (${mock.category})`)
      .join(", ");

    return {
      isValid: false,
      error: `Category mismatch detected. The following mock(s) do not match the template category (${templateCategory}): ${mismatchedTitles}`
    };
  }

  // All validations passed
  return { isValid: true, error: null };
}

export default function TemplatesModal({
  id,
  old_title,
  old_description,
  old_category,
  old_difficulty_level,
  old_mocks,
  old_is_public, // Agar propsda is_public kelsa
}) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: old_title || "",
      description: old_description || "",
      category: old_category || "",
      difficulty_level: old_difficulty_level || "",
      mocks: [],
      is_public: old_is_public || false,
    },
  });

  const MockCategory = watch("category");
  const selectedMocks = watch("mocks");

  // Real-time validation feedback with smart guidance
  const getSelectionFeedback = () => {
    if (!MockCategory || !["EXAM_TEMPLATE", "PRACTICE_TEMPLATE"].includes(MockCategory)) {
      return null;
    }

    if (!selectedMocks || selectedMocks.length === 0) {
      return {
        type: "info",
        message: "📋 Select 3 mocks: 1 Listening, 1 Reading, and 1 Writing"
      };
    }

    // Build a helpful message showing what's been selected and what's needed
    const types = {
      LISTENING: selectedMocks.some(m => m.mock_type === "LISTENING"),
      READING: selectedMocks.some(m => m.mock_type === "READING"),
      WRITING: selectedMocks.some(m => m.mock_type === "WRITING")
    };

    const selectedCount = selectedMocks.length;
    const selectedTypesArray = [];
    const neededTypesArray = [];

    if (types.LISTENING) selectedTypesArray.push("✓ Listening");
    else neededTypesArray.push("Listening");

    if (types.READING) selectedTypesArray.push("✓ Reading");
    else neededTypesArray.push("Reading");

    if (types.WRITING) selectedTypesArray.push("✓ Writing");
    else neededTypesArray.push("Writing");

    // All types selected (valid)
    if (selectedCount === 3 && selectedTypesArray.length === 3) {
      return {
        type: "success",
        message: `✓ Perfect! ${selectedTypesArray.join(", ")}`
      };
    }

    // Partially selected - show progress
    if (selectedCount < 3) {
      const progressMsg = selectedTypesArray.length > 0 
        ? `Selected: ${selectedTypesArray.join(", ")}. Still need: ${neededTypesArray.join(", ")}`
        : `Still need: ${neededTypesArray.join(", ")}`;
      
      return {
        type: "info",
        message: `📋 ${progressMsg}`
      };
    }

    // Validation failed (should not happen with smart disabling, but just in case)
    const validation = validateTemplateSelection(selectedMocks, MockCategory);
    if (!validation.isValid) {
      return {
        type: "error",
        message: validation.error
      };
    }

    return null;
  };

  const selectionFeedback = getSelectionFeedback();

  // ========================================================================
  // SMART MOCK FILTERING & DISABLING LOGIC
  // ========================================================================

  /**
   * Get all available mocks, filtered by:
   * 1. Category match (only show mocks of the selected template category)
   * 2. Non-deleted mocks
   */
  const { data: mocksData } = useSWR(
    ["/mocks/", router.locale, MockCategory],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&category=${MockCategory}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const allMocks = useMemo(() => {
    return Array.isArray(mocksData?.results)
      ? mocksData.results
      : Array.isArray(mocksData)
      ? mocksData
      : [];
  }, [mocksData]);

  /**
   * REQUIREMENT 1: Auto-Filtering (Category Match)
   * Filter mocks to only show those matching the selected category.
   * This prevents category mismatches at the UI level.
   */
  const filteredMocksByCategory = useMemo(() => {
    if (!MockCategory || !["EXAM_TEMPLATE", "PRACTICE_TEMPLATE"].includes(MockCategory)) {
      return allMocks;
    }

    // Only show mocks that match the selected template category
    return allMocks.filter(mock => mock.category === MockCategory);
  }, [allMocks, MockCategory]);

  /**
   * REQUIREMENT 2: Smart Disabling (Unique Types Enforcement)
   * Determine which mock types are already selected.
   * Used to disable options of already-selected types.
   */
  const selectedMockTypes = useMemo(() => {
    if (!selectedMocks || selectedMocks.length === 0) {
      return new Set();
    }
    return new Set(selectedMocks.map(mock => mock.mock_type));
  }, [selectedMocks]);

  /**
   * Check if a specific mock option should be disabled.
   * 
   * A mock is disabled if:
   * 1. Its type (LISTENING/READING/WRITING) is already selected
   * 2. AND it's not already in the selected list (allow deselection)
   * 
   * @param {Object} option - The mock option to check
   * @returns {boolean} - True if option should be disabled
   */
  const isOptionDisabled = (option) => {
    // If this option is already selected, allow it (for deselection)
    const isAlreadySelected = selectedMocks?.some(mock => mock.id === option.id);
    if (isAlreadySelected) {
      return false;
    }

    // If the type is already selected, disable this option
    if (selectedMockTypes.has(option.mock_type)) {
      return true;
    }

    // Otherwise, allow selection
    return false;
  };

  /**
   * Enhanced mock options with disabled state for UI feedback.
   * This allows the MultiSelect to visually show which options are disabled.
   */
  const mockOptionsWithDisabledState = useMemo(() => {
    return filteredMocksByCategory.map(mock => ({
      ...mock,
      isDisabled: isOptionDisabled(mock)
    }));
  }, [filteredMocksByCategory, selectedMockTypes, selectedMocks]);

  const { data: template } = useSWR(
    ["/material-templates/", router.locale, id],
    ([url, locale]) =>
      fetcher(
        `${url}${id}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  useEffect(() => {
    if (old_title && old_category && old_difficulty_level)
      reset({
        title: old_title,
        description: old_description,
        category: old_category,
        difficulty_level: old_difficulty_level,
        mocks: template?.mocks,
        is_public: old_is_public || false,
      });
  }, [
    old_title,
    old_description,
    old_category,
    old_difficulty_level,
    old_is_public,
    id,
    reset,
  ]);

  const submitFn = async (data) => {
    const { title, mocks, description, category, difficulty_level, is_public } =
      data;

    // ========================================================================
    // CLIENT-SIDE VALIDATION: Check template structure before submitting
    // ========================================================================
    const validationResult = validateTemplateSelection(mocks, category);
    if (!validationResult.isValid) {
      toast.error(validationResult.error);
      return; // Stop submission
    }

    try {
      setReqLoading(true);

      // 1. FormData obyekti yaratamiz (Multipart request uchun shart)
      const formData = new FormData();

      // 2. Oddiy maydonlarni qo'shamiz
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("difficulty_level", difficulty_level);
      // Boolean qiymatni stringga o'tkazib yuborgan ma'qul (yoki backend o'zi handle qiladi)
      formData.append("is_public", is_public ? "true" : "false");

      // 3. Arrayni (mocks) to'g'ri formatda qo'shamiz
      // Backend getlist('mocks') qilishi uchun har bir ID alohida 'mocks' kaliti bilan qo'shilishi kerak
      if (mocks && mocks.length > 0) {
        mocks.forEach((item) => {
          // Agar item obyekt bo'lsa (MultiSelectdan kelsa) uning ID sini olamiz
          const id = item?.id || item;
          formData.append("mocks", id);
        });
      }

      // Debug uchun: FormData ichini ko'rish
      // for (var pair of formData.entries()) {
      //     console.log(pair[0]+ ', ' + pair[1]);
      // }

      let response;
      const baseUrl = "/material-templates/";

      // Payload o'rniga formData yuboramiz
      if (id) {
        response = await authAxios.patch(`${baseUrl}${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Template updated successfully!" })
        );
      } else {
        response = await authAxios.post(baseUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          intl.formatMessage({ id: "Template created successfully!" })
        );
      }

      setTimeout(() => {
        closeModal("templatesModal", response?.data);
      }, 500);
    } catch (e) {
      const errorData = e?.response?.data;
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      if (errorData?.error?.mocks) {
        errorMsg = errorData.error?.mocks?.[0];
      } else if (errorData?.error?.category) {
        errorMsg = errorData.error?.category?.[0];
      } else if (errorData?.error?.difficulty_level) {
        // Note: Backend field name typo might differ, check exact key
        errorMsg = errorData.error?.difficulty_level?.[0];
      } else if (errorData?.mocks) {
        // Ba'zan error to'g'ridan-to'g'ri array bo'lib kelishi mumkin
        errorMsg = Array.isArray(errorData.mocks)
          ? errorData.mocks[0]
          : errorData.mocks;
      }

      toast.error(errorMsg);
      console.error(e);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {intl.formatMessage({ id: "Template" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            error={errors?.title?.message}
          />
          <Input
            type="text"
            register={register}
            name="description"
            title={intl.formatMessage({ id: "Description" })}
            placeholder="description"
            required
            validation={{
              required: intl.formatMessage({ id: "Description is required" }),
            }}
            error={errors?.description?.message}
          />

          {!id && (
            <Controller
              name="category"
              control={control}
              rules={{ required: intl.formatMessage({ id: "Required" }) }}
              render={({ field }) => (
                <Select
                  {...field}
                  title={intl.formatMessage({ id: "Category" })}
                  placeholder={intl.formatMessage({ id: "Select" })}
                  options={MOCK_TEMPLATES}
                  error={errors.category?.message}
                />
              )}
            />
          )}
          <Controller
            name="difficulty_level"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Difficulty level" })}
                placeholder={intl.formatMessage({ id: "Select" })}
                options={TEMPLATE_D_LEVEL}
                error={errors.difficulty_level?.message}
              />
            )}
          />
          <div className={`${!id ? "sm:col-span-2 col-span-1" : ""}`}>
            <Controller
              name="mocks"
              control={control}
              rules={{ required: intl.formatMessage({ id: "Required" }) }}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <MultiSelect
                    {...field}
                    title={intl.formatMessage({ id: "Mocks" })}
                    placeholder={intl.formatMessage({ id: "Select" })}
                    options={mockOptionsWithDisabledState}
                    error={errors.mocks?.message}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val)}
                    isOptionDisabled={(option) => option.isDisabled === true}
                    maxSelections={3}
                  />
                  {selectionFeedback && (
                    <div
                      className={`text-sm px-3 py-2 rounded-lg ${
                        selectionFeedback.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : selectionFeedback.type === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {selectionFeedback.message}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <ToggleSwitch
              control={control}
              name="is_public"
              label="Is public"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center sm:w-auto w-full text-white p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
