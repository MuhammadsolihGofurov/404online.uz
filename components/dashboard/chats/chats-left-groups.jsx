import { ChatsLeftGroupsSkeleton } from "@/components/skeleton/chats";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useParams } from "@/hooks/useParams";
import { CHATS_URL } from "@/mock/router";
import fetcher from "@/utils/fetcher";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function ChatsLeftGroups({ onSelectGroup, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { findParams } = useParams();
  const currentGroup = findParams("group_id") || "";

  const { data: datas, isLoading } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Ranglar arrayi (10 ta rang)
  const colors = [
    "bg-main",
    "bg-green-500",
    "bg-blue-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];

  if (loading || isLoading) {
    return <ChatsLeftGroupsSkeleton />;
  }

  const handleLink = (group_id) => {
    onSelectGroup(group_id);
  };

  return (
    <>
      <div className="p-3 text-sm font-semibold text-gray-600 tracking-wide">
        {intl.formatMessage({ id: "Groups" })}
      </div>
      <div className="px-2 flex flex-col gap-1 h-[75vh] overflow-y-auto scroll_none">
        {datas?.map((g, i) => {
          const colorClass = colors[i % colors.length];
          return (
            <button
              key={i}
              onClick={() => handleLink(g?.id)}
              className={`px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 transition flex items-center gap-2 ${
                currentGroup == g?.id ? "bg-gray-100" : ""
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold ${colorClass}`}
              >
                {g?.name?.slice(0, 1)}
              </span>
              <span className="text-xs text-textPrimary flex-1 text-start">{g?.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
