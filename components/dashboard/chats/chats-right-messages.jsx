import { useChat } from "@/hooks/useChat";
import { useParams } from "@/hooks/useParams";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { ChatMessageInputArea, ChatMessagesBody } from "./details";
import { MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";

export default function ChatsRightMessages({ loading, role, isWriteTopic }) {
  const { findParams } = useParams();
  const groupId = findParams("group_id");
  const topicId = findParams("topic_id");
  const token =
    typeof window !== "undefined" ? localStorage.getItem(PRIVATEAUTHKEY) : "";
  const chat = useChat(token, groupId, topicId);
  const { currentTopic } = useSelector((state) => state.settings);

  if (!(groupId && topicId)) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 flex-col text-gray-300 font-medium text-sm">
        <MessageCircle className="w-7 h-7 opacity-60" />
        Select a topic to view messages
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b flex items-center gap-3">
        <div className="font-semibold text-gray-800">
          {chat.channelName || "#topic"}
        </div>
        <div className="text-xs text-gray-500">
          {chat.memberCount
            ? `${chat.memberCount} participants`
            : "Participants hidden"}
        </div>
      </div>

      <ChatMessagesBody chat={chat} loading={loading} />
      {currentTopic?.can_current_user_write ? (
        <ChatMessageInputArea chat={chat} topicId={topicId} />
      ) : (
        <></>
      )}
    </>
  );
}
