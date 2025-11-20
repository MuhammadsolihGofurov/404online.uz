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
    <div className="w-full flex flex-col gap-5">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border rounded-xl p-5 bg-gray-50 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">
              {intl.formatMessage({ id: "Part" })} {field.part_number}
            </h2>
            {category === "CUSTOM" && fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 text-sm"
              >
                {intl.formatMessage({ id: "Remove" })}
              </button>
            )}
          </div>

          {/* Hidden part_number */}
          <input
            type="hidden"
            {...register(`parts.${index}.part_number`)}
            value={field.part_number}
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
                <ImageUploadBox value={field.value} onChange={field.onChange} />
              )}
            />
          )}

          {/* audio_file */}
          {config.fields.includes("audio_file") && (
            <Input
              type="file"
              register={register}
              name={`parts.${index}.audio_file`}
              defaultValue={field.audio_file || null}
              title={intl.formatMessage({ id: "Audio File" })}
              error={errors?.parts?.[index]?.audio_file?.message}
            />
          )}
        </div>
      ))}
    </div>
  );
}
