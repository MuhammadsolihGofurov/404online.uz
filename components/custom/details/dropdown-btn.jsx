import React from "react";
import { useIntl } from "react-intl";

export default function DropdownBtn({
  title,
  icon,
  onClick,
  className = "",
  iconClass = "",
}) {
  const intl = useIntl();

  return (
    <button
      type="button"
      className={`w-full flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-gray-50 ${className}`}
      onClick={onClick}
    >
      {icon &&
        React.cloneElement(icon, {
          className: `h-4 w-4 ${icon.props.className || ""} ${iconClass}`,
        })}
      {intl.formatMessage({ id: title })}
    </button>
  );
}
