import { Dropdown, DropdownBtn } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { GROUPS_URL, GROUPSMEMBERS_URL } from "@/mock/router";
import { authAxios } from "@/utils/axios";
import {
  Check,
  Edit2,
  MoreVertical,
  Trash2,
  Users,
  Users2,
} from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function GroupListItem({ item, role }) {
  const { openModal } = useModal();
  const intl = useIntl();
  const router = useRouter();

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete group",
        description:
          "Are you sure you want to delete this group? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/groups/${id}/`);
          toast.success(
            intl.formatMessage({ id: "Group deleted successfully!" })
          );
        },
      },
      "short"
    );
  };

  return (
    <div className="rounded-xl bg-[#F7F6FA] overflow-hidden">
      <div className="bg-[#495e61] min-h-[72px] relative">
        <div className="w-14 h-14 rounded-full bg-slate-400 absolute -bottom-5 left-2/4 -translate-x-2/4 flex items-center justify-center font-semibold text-textPrimary">
          {item?.name?.slice(0, 1).toUpperCase()}
        </div>
      </div>
      <div className="px-3 pb-3 pt-7 text-center text-textPrimary text-sm font-medium">
        {item?.name}
      </div>
      <div className="w-full p-3 text-sm border-t border-t-gray-200 text-[#625F68] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-textPrimary">
          <Users className="h-4 w-4" />
          <span>{item?.member_count}</span>
        </div>
        <Dropdown
          buttonContent={<MoreVertical className="h-5 w-5 text-gray-500" />}
        >
          {/* ! center admin */}
          {role === "CENTER_ADMIN" && (
            <>
              <DropdownBtn
                title="Edit"
                icon={<Edit2 className="text-gray-500" />}
                onClick={() =>
                  openModal(
                    "addGroup",
                    { id: item?.id, initialData: item },
                    "short"
                  )
                }
              />

              <DropdownBtn
                title="Delete"
                icon={<Trash2 className="text-red-500" />}
                className="text-red-500"
                onClick={() => handleDelete(item?.id)}
              />

              <DropdownBtn
                title="Members"
                icon={<Users className="text-gray-500" />}
                onClick={() => router.push(`${GROUPSMEMBERS_URL}?group_id=${item?.id}`)}
              />
            </>
          )}
        </Dropdown>
      </div>
    </div>
  );
}
