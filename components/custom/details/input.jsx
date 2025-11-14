import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Eye, EyeOff } from "lucide-react"; // 👁 iconlar uchun (lucide-react kutubxonasi)

export default function Input({
  type,
  placeholder,
  name,
  title,
  required,
  register = () => {},
  validation,
  noSelected = false,
  error
}) {
  const intl = useIntl();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="flex flex-col items-start w-full gap-2 sm:bg-transparent bg-white rounded-xl relative">
      {title && (
        <span className="text-textSecondary font-semibold text-sm">
          {title}
        </span>
      )}

      <div className="relative w-full">
        <input
          type={inputType}
          placeholder={placeholder}
          name={name}
          id={name}
          required={required}
          autoComplete="off"
          disabled={noSelected}
          className={`rounded-xl p-4 flex-1 w-full border border-buttonGrey outline-none placeholder:font-normal placeholder:text-inputPlaceholder pr-12 ${
            error ? "border-red-500" : "focus:border-main"
          }`}
          {...register(name, validation)}
        />

        {/* 👁 Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-main transition-colors"
          >
            {showPassword ? (
              <EyeOff size={20} strokeWidth={1.5} />
            ) : (
              <Eye size={20} strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </label>
  );
}
