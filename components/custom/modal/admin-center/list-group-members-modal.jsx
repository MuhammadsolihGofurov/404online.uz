import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { Move, Shuffle, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useModal } from "@/context/modal-context";
import { toast } from "react-toastify";
import { authAxios } from "@/utils/axios";

export default function ListGroupMembersModal({ group_id }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal } = useModal();

  const { data: members } = useSWR(
    [`/groups/${group_id}/members/`, router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  const handleDelete = (member_id) => {
    openModal(
      "confirm",
      {
        title: "Remove member",
        description:
          "Are you sure you want to remove this member from the group? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/groups/${group_id}/members/${member_id}/`);
          toast.success("Member removed!");
        },
      },
      "short"
    );
  };

  const roleColors = {
    STUDENT: "sm:bg-blue-100 text-blue-700",
    TEACHER: "sm:bg-green-100 text-green-700",
    CENTER_ADMIN: "sm:bg-gray-200 text-gray-700",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-textPrimary text-center font-bold text-2xl">
        {intl.formatMessage({ id: "Group members list" })}
      </h1>

      <div className="flex flex-col divide-y divide-gray-200">
        {members?.map((user) => {
          const isStudent = user.role === "STUDENT";
          const firstLetter = user?.full_name?.slice(0, 1)?.toUpperCase();

          return (
            <div
              key={user.id}
              className="flex items-center justify-between px-1 sm:px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    className="w-7 sm:w-10 h-7 sm:h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 sm:w-10 h-7 sm:h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-700">
                    {firstLetter}
                  </div>
                )}

                {/* Name + Role */}
                <div className="flex flex-col items-start">
                  <span className="text-textPrimary font-medium text-sm sm:text-base">
                    {user.full_name}
                  </span>
                  <span
                    className={`mt-0.5 sm:px-2 sm:py-0.5 text-xs font-semibold rounded-full ${
                      roleColors[user.role]
                    }`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Delete button for students */}
              {isStudent && (
                <div
                  className="flex items-center gap-1
                "
                >
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Shuffle className="h-4 w-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
