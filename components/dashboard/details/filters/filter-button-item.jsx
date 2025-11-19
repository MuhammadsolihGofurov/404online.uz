import React from "react";
import { useParams } from "@/hooks/useParams";
import { useIntl } from "react-intl";

export default function FilterButtonItem({ value, label, param }) {
  const { findParams, updateParams, removeParams } = useParams();
  const intl = useIntl();

  const current = findParams(param);
  const activeClass = "font-semibold bg-gray-100";

  return (
    <button
      onClick={() => {
        value == "All" ? removeParams(param) : updateParams(param, value);
      }}
      className={`w-full flex text-start items-center justify-between text-wrap break-words gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
        value === current ? activeClass : ""
      }`}
    >
      {intl.formatMessage({ id: label })}
    </button>
  );
}
