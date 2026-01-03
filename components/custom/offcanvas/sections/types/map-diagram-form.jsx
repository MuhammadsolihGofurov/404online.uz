import React from "react";
import { useFieldArray } from "react-hook-form";
import { MapPinIcon } from "lucide-react";
import { Input } from "@/components/custom/details";

export default function MapDiagramForm({ register, control }) {
  const { fields } = useFieldArray({ control, name: "tokens" });

  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-2 font-bold text-lg uppercase text-gray-700">
        <MapPinIcon className="text-main" size={20} />
        Map Diagram Settings
      </div>

      <div className="grid grid-cols-1 gap-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-4"
          >
            <div className="font-bold text-main border-b pb-1">
              Gap ID: {field.id}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name={`tokens.${index}.answers`}
                title="Correct Letter"
                placeholder="e.g. C"
                register={register}
                required
              />
              <Input
                name={`tokens.${index}.available_zones`}
                title="Available Options (A, B, C...)"
                register={register}
                defaultValue="A, B, C, D, E, F, G, H"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
