import React from "react";
import { Controller } from "react-hook-form";
import { useIntl } from "react-intl";

export default function ToggleSwitch({ control, name, label }) {
  const intl = useIntl();

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={false}
      render={({ field }) => (
        <div className="flex items-center gap-3">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {intl.formatMessage({ id: label })}:
            </span>
          )}

          <div
            onClick={() => field.onChange(!field.value)}
            className={`w-12 h-7 flex items-center rounded-full px-1 cursor-pointer transition-all ${
              field.value ? "bg-main" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all ${
                field.value ? "translate-x-5" : ""
              }`}
            ></div>
          </div>
        </div>
      )}
    />
  );
}
