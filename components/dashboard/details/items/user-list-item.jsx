import { Dropdown, DropdownBtn } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { formatDateToShort } from "@/utils/funcs";
import {
  Check,
  Edit2,
  MoreVertical,
  Plus,
  Slash,
  Trash2,
  Unlink,
  UserPlus,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function UserListItem({ item, role }) {
  const { openModal } = useModal();
  const intl = useIntl();

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete user",
        description:
          "Are you sure you want to delete this user? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/users/${id}/`);
          toast.success(
            intl.formatMessage({ id: "User deleted successfully!" })
          );
        },
      },
      "short"
    );
  };

  const handleUnLinkToTeacher = (assistant_id, teacher_id) => {
    openModal(
      "confirmModal",
      {
        title: "Unlink user",
        description:
          "Do you really want to unlink this user? The connection will be removed, but no data will be deleted.",
        onConfirm: async () => {
          await authAxios.post(`/assistant-teacher/unlink/`, {
            assistant_id,
            teacher_id,
          });
          toast.success(
            intl.formatMessage({ id: "User unlink successfully!" })
          );
        },
      },
      "short"
    );
  };

  const getRoleBadge = (role) => {
    const roles = {
      CENTER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      TEACHER: "bg-blue-100 text-blue-700 border-blue-200",
      ASSISTANT: "bg-orange-100 text-orange-700 border-orange-200",
      STUDENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
      GUEST: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return roles[role] || "bg-gray-100 text-gray-700";
  };

  const handleUpgradeGuestToStudent = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Upgrade guest",
        description:
          "Are you sure you want to upgrate this guest to student? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.post(`/centers/guests/upgrade/`, { user_id: id });
          toast.success(
            intl.formatMessage({ id: "User upgraded successfully!" })
          );
        },
      },
      "short"
    );
  };

  return (
    <tr className="border-b border-b-dashboardBg last:border-b-transparent relative z-0">
      {/* <td className="text-sm p-5 text-center font-medium">{item?.id}</td> */}
      <td className="text-sm p-5 font-medium font-poppins">
        {item?.full_name}
      </td>
      <td className="text-sm p-5 font-medium font-poppins">
        <span
          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getRoleBadge(
            item?.role
          )}`}
        >
          {item?.role?.replace("_", " ")}
        </span>
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
            {item?.my_groups?.length > 0 ? (
              item?.my_groups?.map((group) => {
                return (
                  <div
                    type="button"
                    key={group?.name}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-wrap break-words"
                  >
                    {group?.name}
                  </div>
                );
              })
            ) : (
              <div
                type="button"
                className="w-full flex items-center text-menu gap-2 px-4 py-2 text-xs text-center text-wrap break-words"
              >
                {intl.formatMessage({ id: "There isn't anything" })}
              </div>
            )}
          </Dropdown>
        </button>
      </td>
      <td className="text-sm p-5 font-medium">
        {item?.is_approved ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Approved" })}
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Pending" })}
          </span>
        )}
      </td>
      {/*       <td className="text-sm p-5 font-medium">
        {item?.is_active ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Active" })}
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
            {intl.formatMessage({ id: "Suspended" })}
          </span>
        )}
      </td> */}
      <td className="text-sm p-5 font-medium">
        {formatDateToShort(item?.created_at)}
      </td>

      <td className="relative z-0">
        {/* 🔹 Dropdown menyu */}
        <Dropdown
          buttonContent={<MoreVertical className="h-5 w-5 text-gray-500" />}
        >
          {/* ! center admin */}
          {item?.role !== "CENTER_ADMIN" && (
            <>
              <DropdownBtn
                title="Edit"
                icon={<Edit2 className="text-gray-500" />}
                onClick={() => {
                  openModal(
                    "editUser",
                    { id: item?.id, initialData: item },
                    "short"
                  );
                }}
              />

              <DropdownBtn
                title="Delete"
                icon={<Trash2 className="text-red-500" />}
                className="text-red-500"
                onClick={() => handleDelete(item?.id)}
              />
            </>
          )}

          {/* for assistant to teacher (only CENTER_ADMIN can) */}
          {role === "CENTER_ADMIN" && item?.role === "ASSISTANT" && (
            <>
              <DropdownBtn
                title="Assign to"
                icon={<UserPlus className="text-blue-500" />}
                onClick={() =>
                  openModal(
                    "assignToTeacher",
                    { assistant_id: item?.id, initialData: item?.teacher },
                    "short"
                  )
                }
              />
              {item?.teacher && (
                <DropdownBtn
                  title="Unassign"
                  icon={<Unlink className="text-red-500" />}
                  onClick={() => handleUnLinkToTeacher(item?.id, item?.teacher)}
                />
              )}
            </>
          )}

          {item?.role === "GUEST" && role == "CENTER_ADMIN" && (
            <DropdownBtn
              title="Upgrade"
              icon={<UserPlus className="text-blue-500" />}
              onClick={() => handleUpgradeGuestToStudent(item?.id)}
            />
          )}
        </Dropdown>
      </td>
    </tr>
  );
}
