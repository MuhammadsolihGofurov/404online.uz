import { Dropdown } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { formatDateToShort } from "@/utils/funcs";
import { Check, Edit2, MoreVertical, Plus, Slash, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

const STATUS = {
  PENDING: {
    name: "PENDING",
    color: "bg-yellow-100 text-yellow-700",
  },
  APPROVED: {
    name: "APPROVED",
    color: "bg-green-100 text-green-700",
  },
  REJECTED: {
    name: "REJECTED",
    color: "bg-red-100 text-red-700",
  },
  EXPIRED: {
    name: "EXPIRED",
    color: "bg-gray-100 text-gray-700",
  },
};

export default function InviteCodeListItem({ item }) {
  const { openModal } = useModal();
  const menuRef = useRef(null);
  const intl = useIntl();

  const handleToggleActive = (code) => {
    openModal(
      "confirmModal",
      {
        title: "Confirm Approval",
        description:
          "Are you sure you want to approve this request? This action cannot be undone once confirmed.",
        onConfirm: async () => {
          try {
            await authAxios.post("/centers/invitations/approve/", { code });

            toast.success(
              intl.formatMessage({
                id: "Approve successfully",
              })
            );
          } catch (e) {
            toast.error(e?.response?.data?.error?.detail);
          }
        },
      },
      "short"
    );
  };

  return (
    <tr className="border-b border-b-dashboardBg last:border-b-transparent relative z-0">
      {/* <td className="text-sm p-5 text-center font-medium">{item?.id}</td> */}
      <td className="text-sm p-5 font-medium font-poppins">{item?.code}</td>
      <td className="text-sm p-5 font-medium">{item?.role}</td>
      <td className="text-sm p-5 font-medium">
        {item?.target_user?.full_name}
      </td>
      <td className="text-sm p-5 font-medium">
        <span
          className={`px-2 py-1 rounded-full ${
            STATUS?.[item?.status]?.color
          } text-xs font-semibold`}
        >
          {intl.formatMessage({ id: STATUS?.[item?.status]?.name })}
        </span>
      </td>
      <td className="text-sm p-5 font-medium">
        {formatDateToShort(item?.created_at)}
      </td>

      <td className="relative z-0" ref={menuRef}>
        {/* 🔹 Dropdown menyu */}
        {item?.status == "PENDING" && (
          <Dropdown
            buttonContent={<MoreVertical className="h-5 w-5 text-gray-500" />}
          >
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-green-500"
              onClick={() => {
                if (!item?.target_user) {
                  toast.error(
                    intl.formatMessage({ id: "The user has not sent a request yet!" })
                  );
                } else {
                  handleToggleActive(item?.code, "activate");
                }
              }}
            >
              <Check className="h-4 w-4 text-green-500" /> Activate
            </button>
          </Dropdown>
        )}
      </td>
    </tr>
  );
}
