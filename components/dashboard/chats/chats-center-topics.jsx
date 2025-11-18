import { ChatsCenterTopicsSkeleton } from "@/components/skeleton/chats/chats-center-topics-skeleton";
import { useParams } from "@/hooks/useParams";
import { setTopicsData } from "@/redux/slice/settings";
import fetcher from "@/utils/fetcher";
import { formatDateToShort } from "@/utils/funcs";
import { FolderOpen } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useIntl } from "react-intl";
import { useDispatch } from "react-redux";
import useSWR from "swr";

export default function ChatsCenterTopics({ onSelectTopic, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { findParams } = useParams();
  const currentGroupId = findParams("group_id");
  const currentTopicId = findParams("topic_id");
  const dispatch = useDispatch();

  const handleLink = (id, item) => {
    dispatch(setTopicsData(item));
    onSelectTopic(id);
  };

  const { data: datas, isLoading } = useSWR(
    currentGroupId ? [`/topic-channels/`, router.locale, currentGroupId] : null,
    ([url, locale]) =>
      fetcher(
        `${url}?group_id=${currentGroupId}&page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (!currentGroupId) {
    return (
      <>
        <div className="w-full flex items-center justify-center h-full">
          <p className="flex flex-col gap-3 items-center justify-center py-10 text-center text-gray-300">
            <FolderOpen className="w-7 h-7 opacity-60" />

            <span className="text-sm font-medium">
              {intl.formatMessage({
                id: "Select a group to view topics",
              })}
            </span>
          </p>
        </div>
      </>
    );
  }

  if (loading || isLoading) {
    return (
      <ChatsCenterTopicsWrapper intl={intl}>
        <ChatsCenterTopicsSkeleton />
      </ChatsCenterTopicsWrapper>
    );
  }

  return (
    <ChatsCenterTopicsWrapper intl={intl}>
      <div className="px-3 flex flex-col items-start gap-2 h-[75vh] overflow-y-auto scroll_none">
        {datas?.map((topic, i) => (
          <button
            onClick={() => handleLink(topic?.id, topic)}
            key={i}
            className={`p-4 text-start flex flex-col rounded-xl relative z-0 cursor-pointer shadow-sm min-h-[72px] ${
              currentTopicId == topic?.id
                ? "bg-blue-100 hover:bg-blue-200"
                : "bg-gray-50 hover:bg-gray-100"
            }  transition-colors duration-200 w-full`}
          >
            <span className="font-medium text-textPrimary text-sm">
              {topic?.name}
            </span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-1">
              {topic?.last_message}
            </span>
            <span className="text-[10px] text-gray-600 absolute top-3 right-3">
              {formatDateToShort(topic?.last_message_at)}
            </span>
          </button>
        ))}
      </div>
    </ChatsCenterTopicsWrapper>
  );
}

export const ChatsCenterTopicsWrapper = ({ children, intl }) => {
  return (
    <>
      <div className="p-3 font-semibold text-gray-700 text-sm tracking-wide">
        {intl.formatMessage({ id: "Topics" })}
      </div>
      {children}
    </>
  );
};
