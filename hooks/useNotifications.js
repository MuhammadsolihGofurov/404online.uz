import { useCallback, useEffect, useRef, useState, useMemo } from "react";

function decodeUserId(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.user_id || payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

export function useNotifications(accessToken) {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

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
    [currentUserId]
  );

  const connect = useCallback(() => {
    if (!accessToken) return;

    const ws = new WebSocket(
      `wss://api.404online.uz/ws/notifications/?token=${accessToken}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🔔 Notifications WebSocket Connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data) return;

        const parsed = decorate(data);

        setNotifications((prev) => {
          // duplicate bo‘lmasligi uchun
          if (prev.some((n) => n.id === parsed.id)) return prev;
          return [parsed, ...prev];
        });
      } catch (err) {
        console.error("Notification parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Notifications WebSocket error:", err);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      setIsConnected(false);

      // server yopib yubormasa reconnect qilamiz
      if (event.code !== 1000) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    };
  }, [accessToken, decorate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000, "cleanup");
    };
  }, [connect]);

  return {
    notifications,
    isConnected,
  };
}
