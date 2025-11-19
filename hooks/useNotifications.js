import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "https://api.404online.uz";

function decodeUserId(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.user_id ?? payload.userId ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export function useNotifications(accessToken) {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const upsert = useCallback(
    (next) =>
      setNotifications((prev) => {
        if (!next?.id || prev.some((n) => n.id === next.id)) {
          // already have it
          return prev;
        }
        return [next, ...prev];
      }),
    []
  );

  const fetchInitial = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        console.error("Notifications fetch failed:", res.status);
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data?.results) ? data.results : data;
      setNotifications(items.map(decorate));
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, decorate]);

  const connect = useCallback(() => {
    if (!accessToken) return;

    const ws = new WebSocket(
      `wss://api.404online.uz/ws/notifications/?token=${accessToken}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data) return;
        upsert(decorate(data));
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
      if (event.code !== 1000) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    };
  }, [accessToken, decorate, upsert]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

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
    isLoading,
  };
}
