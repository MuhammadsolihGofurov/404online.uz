import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

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
  const router = useRouter();

  // ✅ Refs - state o'zgarishini chaqirmaydi
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const hasFetchedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const notificationIdsRef = useRef(new Set()); // Dublikatlarni oldini olish

  const currentUserId = useMemo(() => decodeUserId(accessToken), [accessToken]);

  // ✅ Decorator - re-render chaqirmaydi
  const decorate = useCallback(
    (raw) => ({
      ...raw,
      is_own:
        currentUserId != null &&
        String(raw.user_id ?? raw.userId) === String(currentUserId),
    }),
    [currentUserId]
  );

  // ✅ Smart upsert - faqat haqiqiy o'zgarishlarda state yangilanadi
  const upsert = useCallback((next) => {
    if (!next?.id) return;

    // Agar bu notification allaqachon bor bo'lsa, skip
    if (notificationIdsRef.current.has(next.id)) {
      console.log("⏭️ Skipping duplicate notification:", next.id);
      return;
    }

    console.log("✨ Adding new notification:", next.id);
    notificationIdsRef.current.add(next.id);

    setNotifications((prev) => {
      // Double check state'da yo'qligini tekshirish
      if (prev.some((n) => n.id === next.id)) {
        return prev;
      }
      return [next, ...prev];
    });
  }, []);

  // ✅ Initial fetch - faqat bir marta
  const fetchInitial = useCallback(async () => {
    if (!accessToken || hasFetchedRef.current) {
      console.log("⏭️ Skipping fetch - already fetched or no token");
      return;
    }

    console.log("📥 Fetching initial notifications...");
    hasFetchedRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        console.error("❌ Fetch failed:", res.status);
        hasFetchedRef.current = false;
        return;
      }

      const data = await res.json();
      const items = Array.isArray(data?.results) ? data.results : data;

      console.log(`✅ Fetched ${items.length} notifications`);

      // ID'larni tracking qilish
      items.forEach((item) => {
        if (item.id) notificationIdsRef.current.add(item.id);
      });

      setNotifications(items.map(decorate));
    } catch (err) {
      console.error("❌ Fetch error:", err);
      hasFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, decorate]);

  // ✅ WebSocket connection - dublikat ulanishlarni oldini olish
  const connect = useCallback(() => {
    if (!accessToken) {
      console.log("⏭️ No token, skipping WebSocket connection");
      return;
    }

    // Agar allaqachon ulanayotgan yoki ulangan bo'lsa
    if (
      isConnectingRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log("⏭️ Already connecting or connected");
      return;
    }

    console.log("🔌 Connecting to WebSocket...");
    isConnectingRef.current = true;

    // Avvalgi WebSocket'ni yopish
    if (wsRef.current) {
      wsRef.current.close(1000, "reconnecting");
      wsRef.current = null;
    }

    const ws = new WebSocket(
      `wss://api.404online.uz/ws/notifications/?token=${accessToken}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);
      isConnectingRef.current = false;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data) return;

        console.log("📩 New notification:", data.id || "unknown");
        
        // Add notification to state
        upsert(decorate(data));
        
        // Show toast notification
        const notificationMessage = data.message || "New notification";
        const notificationLink = data.link;
        
        // Create clickable toast
        const toastId = toast.info(
          notificationMessage,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: notificationLink
              ? () => {
                  // Use Next.js router for client-side navigation
                  if (typeof window !== "undefined") {
                    if (router && router.push) {
                      router.push(notificationLink);
                    } else {
                      // Fallback to window.location if router is not available
                      window.location.href = notificationLink;
                    }
                  }
                  toast.dismiss(toastId);
                }
              : undefined,
            style: notificationLink
              ? {
                  cursor: "pointer",
                }
              : {},
          }
        );
      } catch (err) {
        console.error("❌ Parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    ws.onclose = (event) => {
      console.log(
        `🔌 WebSocket closed: ${event.code} - ${event.reason || "no reason"}`
      );
      setIsConnected(false);
      isConnectingRef.current = false;

      // Faqat kutilmagan yopilishlarda reconnect
      if (event.code !== 1000 && accessToken) {
        console.log("🔄 Reconnecting in 3s...");
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };
  }, [accessToken, decorate, upsert]);

  // ✅ Initial fetch - mount'da faqat bir marta
  useEffect(() => {
    console.log("🎬 useNotifications hook mounted");
    fetchInitial();

    return () => {
      console.log("🧹 useNotifications hook unmounting");
    };
  }, []); // ✅ Bo'sh dependency - faqat mount/unmount

  // ✅ WebSocket - token o'zgarganda qayta ulanish
  useEffect(() => {
    if (!accessToken) return;

    connect();

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "cleanup");
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [accessToken]); // ✅ Faqat token o'zgarganda

  return {
    notifications,
    isConnected,
    isLoading,
  };
}
