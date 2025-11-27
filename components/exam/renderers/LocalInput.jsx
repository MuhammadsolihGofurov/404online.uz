import React, { useState, useEffect, memo } from "react";

export const LocalInput = memo(({ value, onChange, disabled, placeholder, className, type = "text", onKeyDown }) => {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
});

LocalInput.displayName = "LocalInput";

