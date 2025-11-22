import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { MessageCircle, Hash } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { ChatMessagesBody, ChatMessageInputArea } from "../chats/details";
import { formatDateToShort } from "@/utils/funcs";

export function StudentChatInterface({ user, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const token =
    typeof window !== "undefined" ? localStorage.getItem(PRIVATEAUTHKEY) : "";

  // Fetch student's group(s) - students typically have one group
  const { data: groupsData, isLoading: groupsLoading } = useSWR(
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

  // Parse groups - handle both flat array and paginated response
  const groups = useMemo(() => {
    if (!groupsData) return [];
    return Array.isArray(groupsData) ? groupsData : groupsData?.results || [];
  }, [groupsData]);

  // Get the first (and typically only) group for the student
  const studentGroup = groups.length > 0 ? groups[0] : null;
  const groupId = studentGroup?.id;

  // Fetch channels for the student's group
  const { data: channelsData, isLoading: channelsLoading } = useSWR(
    groupId ? ["/topic-channels/", router.locale, groupId] : null,
    ([url, locale, gId]) =>
      fetcher(
        `${url}?group_id=${gId}&page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Parse channels - handle both flat array and paginated response
  const channels = useMemo(() => {
    if (!channelsData) return [];
    return Array.isArray(channelsData)
      ? channelsData
      : channelsData?.results || [];
  }, [channelsData]);

  // Auto-select first channel if none selected and channels are available
  React.useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Get selected channel metadata
  const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);

  // Initialize chat hook for the selected channel
  const chat = useChat(token, groupId, selectedChannelId);

  if (loading || groupsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!studentGroup) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {intl.formatMessage({
              id: "You are not assigned to any group yet.",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (channelsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Loading channels...</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {intl.formatMessage({
              id: "No channels available in your group.",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 bg-gray-50 rounded-2xl overflow-hidden h-[75vh]">
      {/* ===== LEFT SIDEBAR: Channels List ===== */}
      <div className="col-span-3 bg-white border-r border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">
            {intl.formatMessage({ id: "Channels" })}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{studentGroup?.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto scroll_none">
          <div className="p-2 space-y-1">
            {channels.map((channel) => {
              const isActive = channel.id === selectedChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 opacity-60" />
                    <span className="text-sm truncate">{channel.name}</span>
                  </div>
                  {channel.last_message && (
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {channel.last_message}
                    </div>
                  )}
                  {channel.last_message_at && (
                    <div className="mt-1 text-[10px] text-gray-400">
                      {formatDateToShort(channel.last_message_at)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Chat Window ===== */}
      <div className="col-span-9 bg-white h-full flex flex-col">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-800">
                    {selectedChannel.name}
                  </h2>
                </div>
                {selectedChannel.member_count && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedChannel.member_count}{" "}
                    {intl.formatMessage({ id: "participants" })}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {chat.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </div>
            </div>

            {/* Messages Area */}
            <ChatMessagesBody chat={chat} loading={false} />

            {/* Input Area - Only show if channel allows student writes */}
            {!chat.readOnly ? (
              <ChatMessageInputArea chat={chat} topicId={selectedChannelId} />
            ) : (
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                {intl.formatMessage({
                  id: "This channel is read-only for students.",
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {intl.formatMessage({
                  id: "Select a channel to start chatting",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

