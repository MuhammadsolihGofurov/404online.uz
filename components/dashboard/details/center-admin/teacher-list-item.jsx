import { Dropdown } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { formatDateToShort } from "@/utils/funcs";
import { Check, Edit2, MoreVertical, Plus, Slash, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function TeacherListItem({ item }) {
  const { openModal } = useModal();
  const menuRef = useRef(null);
  const intl = useIntl();

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete Center",
        description:
          "Are you sure you want to delete this center? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/owner/centers/${id}/`);
          toast.success(
            intl.formatMessage({ id: "Center deleted successfully!" })
          );
        },
      },
      "short"
    );
  };

  const handleToggleActive = (id, actionType) => {
    const isSuspend = actionType === "suspend";

    openModal(
      "confirmModal",
      {
        title: isSuspend ? "Suspend Center" : "Activate Center",
        description: isSuspend
          ? "Are you sure you want to suspend this center? Suspended centers will not be active until reactivated."
          : "Are you sure you want to activate this center? The center will be active immediately.",
        onConfirm: async () => {
          try {
            const url = isSuspend
              ? `/owner/centers/${id}/suspend/`
              : `/owner/centers/${id}/activate/`;

            await authAxios.post(url);

            toast.success(
              intl.formatMessage({
                id: isSuspend
                  ? "Center suspended successfully!"
                  : "Center activated successfully!",
              })
            );
          } catch (e) {
            toast.error(
              e?.response?.data?.error?.detail ||
                (isSuspend
                  ? "Error suspending center"
                  : "Error activating center")
            );
          }
        },
      },
      "short"
    );
  };

  return (
    <tr className="border-b border-b-dashboardBg last:border-b-transparent relative z-0">
      <td className="text-sm p-5 text-center font-medium">{item?.id}</td>
      <td className="text-sm p-5 font-medium font-poppins">
        {item?.center_name}
      </td>
      <td className="text-sm p-5 font-medium">
        <button type="button">
          {/* 🔹 Dropdown menyu */}
          <Dropdown
            width="w-64"
            buttonContent={
              <span>{intl.formatMessage({ id: "View all" })}</span>
            }
          >
            {item?.centeradmin_emails?.length > 0 ? (
              item?.centeradmin_emails?.map((admin) => {
                return (
                  <button
                    type="button"
                    key={admin?.email}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-wrap break-words"
                  >
                    {admin?.full_name}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                className="w-full flex items-center text-menu gap-2 px-4 py-2 text-xs text-center text-wrap break-words"
              >
                {intl.formatMessage({ id: "There isn't anything" })}
              </button>
            )}
          </Dropdown>
        </button>
      </td>
      <td className="text-sm p-5 font-medium">{item?.teacher_count}</td>
      <td className="text-sm p-5 font-medium">
        {item?.is_active ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Active" })}
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Suspended" })}
          </span>
        )}
      </td>
      <td className="text-sm p-5 font-medium">
        {formatDateToShort(item?.created_at)}
      </td>

      <td className="relative z-0" ref={menuRef}>
        {/* 🔹 Dropdown menyu */}
        <Dropdown
          buttonContent={<MoreVertical className="h-5 w-5 text-gray-500" />}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              openModal(
                "createEduCenter",
                { id: item?.id, initialData: item },
                "short"
              );
            }}
          >
            <Edit2 className="h-4 w-4 text-gray-500" /> Edit
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-500"
            onClick={() => handleDelete(item?.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" /> Delete
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() =>
              openModal("eduCenterCreateAdmin", { id: item?.id }, "short")
            }
          >
            <Plus className="h-4 w-4 text-main" /> Admin
          </button>

          {item?.is_active ? (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-yellow-500"
              onClick={() => handleToggleActive(item?.id, "suspend")}
            >
              <Slash className="h-4 w-4 text-yellow-500" /> Suspend
            </button>
          ) : (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-green-500"
              onClick={() => handleToggleActive(item?.id, "activate")}
            >
              <Check className="h-4 w-4 text-green-500" /> Activate
            </button>
          )}
        </Dropdown>
      </td>
    </tr>
  );
}
