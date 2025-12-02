import React, { useState, useRef, useEffect, memo } from "react";

export const LocalInput = memo(({ value, onChange, disabled, placeholder, className, type = "text", onKeyDown }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const isFocusedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const initialValueRef = useRef(value);

  // CRITICAL FIX: BLOCK server updates if user has touched the input
  // This prevents race condition where polling overwrites local changes
  useEffect(() => {
    // ONLY sync on initial mount
    if (initialValueRef.current === undefined && value !== undefined) {
      initialValueRef.current = value;
      setLocalValue(value || "");
      return;
    }

    // NEVER sync if focused or dirty - user is actively editing
    if (isFocusedRef.current || isDirtyRef.current) {
      return; // ← KILL THE SYNC
    }

    // Only sync if value actually changed from server (not from our own update)
    if (value !== localValue) {
      setLocalValue(value || "");
    }
  }, [value, localValue]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isDirtyRef.current = true; // Mark as dirty - BLOCKS server updates
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (localValue !== value) {
      onChange(localValue);
      // Keep dirty flag for 2 seconds to prevent race condition
      setTimeout(() => {
        isDirtyRef.current = false;
      }, 2000);
    } else {
      isDirtyRef.current = false;
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
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
});

LocalInput.displayName = "LocalInput";

