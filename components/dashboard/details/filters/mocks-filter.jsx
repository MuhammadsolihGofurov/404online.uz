import { Dropdown } from "@/components/custom/details";
import { useParams } from "@/hooks/useParams";
import { ForCenterAdmin } from "@/mock/roles";
import React from "react";
import { useIntl } from "react-intl";
import { FilterButtonItem } from ".";
import { MOCK_CATEGORIES, MOCK_TYPES } from "@/mock/data";

export default function MocksFilter() {
  const { findParams } = useParams();
  const intl = useIntl();

  const currentCategory = findParams("category") || "Category";
  const currentMockType = findParams("mock_type") || "Type";

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col sm:flex-row flex-wrap sm:items-center gap-5">
      <p className="text-textPrimary text-sm font-semibold">
        {intl.formatMessage({ id: "Filters" })}:
      </p>

      {/* ROLE FILTER */}
      <Dropdown
        width="w-40"
        type="filter"
        dropdown_width="w-full sm:w-[200px]"
        buttonContent={currentCategory}
      >
        <FilterButtonItem value="All" label="All" param="category" />

        {MOCK_CATEGORIES?.map((item, index) => (
          <FilterButtonItem
            key={index}
            value={item?.value}
            label={item?.name}
            param="category"
          />
        ))}
      </Dropdown>

      {/* STATUS FILTER */}
      <Dropdown
        width="w-40"
        type="filter"
        dropdown_width="w-full sm:w-[200px]"
        buttonContent={currentMockType}
      >
        {MOCK_TYPES.map((item, index) => (
          <FilterButtonItem
            key={index}
            value={item.value}
            label={item.name}
            param="mock_type"
          />
        ))}
      </Dropdown>
    </div>
  );
}
