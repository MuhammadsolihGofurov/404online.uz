import { Dropdown } from "@/components/custom/details";
import { useParams } from "@/hooks/useParams";
import { ForCenterAdmin } from "@/mock/roles";
import React from "react";
import { useIntl } from "react-intl";
import { FilterButtonItem } from ".";

export default function UserFilter() {
  const { findParams, updateParams } = useParams();
  const intl = useIntl();

  const currentRole = findParams("role") || "Role";
  const isActiveUser = findParams("is_active") || "Status";
  const isApprovedUser = findParams("is_approved") || "Approve";

  // Role & status button options
  const statusOptions = [
    { value: "All", label: "All" },
    { value: "Active", label: "Active" },
    { value: "No active", label: "No active" },
  ];

  const approvedOptions = [
    { value: "All", label: "All" },
    { value: "Approved", label: "Approved" },
    { value: "Pending", label: "Pending" },
  ];

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-row items-center gap-5">
      <p className="text-textPrimary text-sm font-semibold">
        {intl.formatMessage({ id: "Filters" })}:
      </p>

      {/* ROLE FILTER */}
      <Dropdown type="filter" buttonContent={currentRole}>
        <FilterButtonItem value="All" label="All" param="role" />

        {ForCenterAdmin?.map((item, index) => (
          <FilterButtonItem
            key={index}
            value={item?.value}
            label={item?.name}
            param="role"
          />
        ))}
        <FilterButtonItem value="GUEST" label="Guest" param="role" />
      </Dropdown>

      {/* STATUS FILTER */}
      <Dropdown type="filter" buttonContent={isActiveUser}>
        {statusOptions.map((item, index) => (
          <FilterButtonItem
            key={index}
            value={item.value}
            label={item.label}
            param="is_active"
          />
        ))}
      </Dropdown>

      {/* APPROVED FILTER */}
      <Dropdown type="filter" buttonContent={isApprovedUser}>
        {approvedOptions.map((item, index) => (
          <FilterButtonItem
            key={index}
            value={item.value}
            label={item.label}
            param="is_approved"
          />
        ))}
      </Dropdown>
    </div>
  );
}
