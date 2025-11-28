import React from "react";
import { ImageUploadBox, Input } from "@/components/custom/details";
import { Controller, useFieldArray } from "react-hook-form";
import { useParams } from "@/hooks/useParams";
import { MOCK_CONFIG } from "@/mock/data";

export default function Dynamic3PartsForm({
  mockType,
  control,
  register,
  errors,
  intl,
  onDeleteExistingImage,
}) {
  const config = MOCK_CONFIG[mockType] || { parts: 1, fields: [] };
  const { findParams } = useParams();
  const category = findParams("category");

  // useFieldArray bilan dynamic parts
  const { fields, remove } = useFieldArray({
    control,
    name: "parts",
  });

  return (
    <div className="flex flex-col w-full gap-5">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-5 space-y-4 border rounded-xl bg-gray-50"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {intl.formatMessage({ id: "Part" })} {field.part_number}
            </h2>
            {category === "CUSTOM" && fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-sm text-red-500"
              >
                {intl.formatMessage({ id: "Remove" })}
              </button>
            )}
          </div>

          {/* Hidden identifiers */}
          <input
            type="hidden"
            {...register(`parts.${index}.part_number`)}
            value={field.part_number}
          />
          <input
            type="hidden"
            {...register(`parts.${index}.section_id`)}
            value={field.section_id || ""}
          />

          {/* instructions */}
          {config.fields.includes("instructions") && (
            <Input
              register={register}
              name={`parts.${index}.instructions`}
              defaultValue={field.instructions || ""}
              title={intl.formatMessage({ id: "Instructions" })}
              placeholder="Instructions"
              error={errors?.parts?.[index]?.instructions?.message}
            />
          )}

          {/* images */}
          {config.fields.includes("images") && (
            <Controller
              name={`parts.${index}.images`}
              control={control}
              defaultValue={field.images || []}
              render={({ field }) => (
                <ImageUploadBox
                  value={field.value}
                  onChange={field.onChange}
                  onDeleteExisting={onDeleteExistingImage}
                />
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
