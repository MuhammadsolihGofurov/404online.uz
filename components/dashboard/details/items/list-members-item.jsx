import React from "react";
import { formatDateToShort } from "@/utils/funcs";
import { Edit2, Trash2 } from "lucide-react";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useIntl } from "react-intl";

export default function ListMembersItem({ member, group_id }) {
  const { openModal } = useModal();
  const intl = useIntl();

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Remove member",
        description:
          "Are you sure you want to remove this member from the group? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/group-memberships/${member?.id}/`);
          toast.success(intl.formatMessage({ id: "Member removed!" }));
        },
      },
      "short"
    );
  };

  const roleStyles = {
    STUDENT: "bg-blue-100 text-blue-700",
    TEACHER: "bg-green-100 text-green-700",
    CENTER_ADMIN: "bg-gray-100 text-gray-700",
    ASSISTANT: "bg-purple-100 text-purple-700",
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      {/* ID */}
      <td className="text-center p-4">{member.id}</td>

      {/* Avatar + Name */}
      <td className="flex items-center gap-3 p-4 font-medium">
        <span className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-center">
          <img
            src={member.avatar}
            alt={member.full_name}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
            title={member?.full_name}
          />
        </span>
        {member?.full_name}
      </td>

      {/* Role */}
      <td className="p-4">
        <span
          className={`px-2 py-1 text-xs rounded-md ${
            roleStyles[member.role] || "bg-gray-100 text-gray-700"
          }`}
        >
          {member.role.replace("_", " ")}
        </span>
      </td>

      {/* Created At */}
      <td className="p-4">{formatDateToShort(member.created_at)}</td>

      {/* Actions */}
      <td className="text-center p-4">
        {member.role === "STUDENT" && (
          <>
            <button
              onClick={() =>
                openModal(
                  "changeGroupMember",
                  {
                    initialData: { user_id: member?.id, to_group_id: group_id },
                  },
                  "short"
                )
              }
              className="p-1 rounded hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="h-4 w-4 text-blue-500" />
            </button>
            <button
              onClick={() => handleDelete(member.id)}
              className="p-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
