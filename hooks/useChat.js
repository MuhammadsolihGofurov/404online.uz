import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { authAxios } from '@/utils/axios';

function decodeUserId(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.user_id || payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

export function useChat(accessToken, groupId, topicId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channelMeta, setChannelMeta] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const currentUserId = useMemo(() => decodeUserId(accessToken), [accessToken]);

  const decorate = useCallback(
    (raw) => ({
      ...raw,
      is_own:
        currentUserId != null &&
        String(raw.user_id ?? raw.userId) === String(currentUserId),
    }),
    [currentUserId],
  );

  useEffect(() => {
    if (!accessToken || !topicId) return;

    const source = axios.CancelToken.source();
    (async () => {
      try {
        const resp = await authAxios.get(`/topic-channels/${topicId}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cancelToken: source.token,
        });
        setChannelMeta(resp.data);
      } catch (err) {
        if (!axios.isCancel(err)) setChannelMeta(null);
      }
    })();

    return () => source.cancel('Component unmounted');
  }, [accessToken, topicId]);

  const connect = useCallback(() => {
    if (!accessToken || !groupId || !topicId) return;

    const ws = new WebSocket(
      `wss://api.404online.uz/ws/chat/${groupId}/${topicId}/?token=${accessToken}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ command: 'get_history' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data?.type === 'message_history') {
          setMessages((data.messages || []).map(decorate));
          return;
        }

        if (data?.type === 'message_update' && data?.message) {
          const incoming = decorate(data.message);
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            const copy = prev.slice();
            copy[idx] = { ...prev[idx], ...incoming };
            return copy;
          });
          return;
        }

        const payload = data?.payload || data;
        if (payload?.id) {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.id)
              ? prev
              : [...prev, decorate(payload)],
          );
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (event.code !== 1000) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    };
  }, [accessToken, groupId, topicId, decorate]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000, 'cleanup');
    };
  }, [connect]);

  const sendMessage = useCallback(
    async ({ text = '', files = [], file, replyToId } = {}) => {
      const trimmedText = (text ?? '').trim();
      let normalizedFiles = [];
      if (Array.isArray(files)) {
        normalizedFiles = files.filter(Boolean);
      } else if (
        typeof FileList !== 'undefined' &&
        files instanceof FileList
      ) {
        normalizedFiles = Array.from(files).filter(Boolean);
      } else if (files) {
        normalizedFiles = [files];
      }
      if (file) normalizedFiles.push(file);

      if (normalizedFiles.length > 0) {
        const formData = new FormData();
        formData.append('channel', topicId);
        formData.append('message', trimmedText);
        normalizedFiles.forEach((upload) => {
          formData.append('attachments', upload);
        });
        if (replyToId) formData.append('reply_to', replyToId);

        await authAxios.post('/chat-messages/', formData);
        return; // REST call broadcasts `message_update` with attachments
      }

      if (!trimmedText) {
        throw new Error('Message text or attachments required');
      }

      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected');
      }

      const payload = { message: trimmedText };
      if (replyToId) payload.reply_to_id = replyToId;
      socket.send(JSON.stringify(payload));
    },
    [topicId],
  );

  return {
    messages,
    isConnected,
    sendMessage,
    memberCount: channelMeta?.member_count ?? null,
    channelName: channelMeta?.name ?? '',
    readOnly: channelMeta ? !channelMeta.can_current_user_write : false,
  };
}
