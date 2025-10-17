import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface Notification {
  id: string;
  type:
    | "LIKE"
    | "COMMENT"
    | "FOLLOW"
    | "POST"
    | "ECHO"
    | "SYSTEM"
    | "CHAT_MESSAGE";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  post?: {
    id: string;
    title: string;
  };
  chatRoom?: {
    id: string;
    name: string;
  };
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
  onNewNotification?: (notification: Notification) => void;
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {},
) {
  const {
    enabled = true,
    pollingInterval = 15000, // 15 seconds default
    onNewNotification,
  } = options;

  const pathname = usePathname();

  // Only enable polling on specific pages: home, discover, and community posts
  const shouldEnablePolling =
    enabled &&
    (pathname === "/" ||
      pathname.startsWith("/discover") ||
      pathname.includes("/communities/") ||
      pathname.includes("/posts"));

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onNewNotificationRef = useRef(options.onNewNotification);

  // Update the callback ref when onNewNotification changes
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=10");

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data: NotificationResponse = await response.json();

      if (!isMountedRef.current) return;

      // Detect new notifications
      const currentNotificationIds = new Set(
        data.notifications.map((n) => n.id),
      );
      const newNotifications = data.notifications.filter(
        (n) => !previousNotificationIdsRef.current.has(n.id) && !n.isRead,
      );

      // Call callback for each new notification
      if (
        onNewNotificationRef.current &&
        previousNotificationIdsRef.current.size > 0
      ) {
        newNotifications.forEach((notification) => {
          onNewNotificationRef.current!(notification);
        });
      }

      previousNotificationIdsRef.current = currentNotificationIds;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      console.error(
        "[useRealtimeNotifications] Error fetching notifications:",
        err,
      );
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch notifications",
        );

        // Stop polling on connection errors to prevent spam
        if (
          err instanceof Error &&
          (err.message.includes("Failed to fetch") ||
            err.message.includes("ERR_CONNECTION_REFUSED") ||
            err.message.includes("NetworkError"))
        ) {
          console.warn(
            "[useRealtimeNotifications] Stopping polling due to connection error",
          );
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      if (isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      }
    } catch (err) {
      console.error(
        "[useRealtimeNotifications] Error marking notifications as read:",
        err,
      );
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      if (isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true })),
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(
        "[useRealtimeNotifications] Error marking all notifications as read:",
        err,
      );
      throw err;
    }
  }, []);

  const deleteNotifications = useCallback(
    async (notificationIds: string[]) => {
      try {
        const response = await fetch("/api/notifications", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete notifications");
        }

        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.filter(
              (notification) => !notificationIds.includes(notification.id),
            ),
          );
          // Refetch to get updated counts
          fetchNotifications();
        }
      } catch (err) {
        console.error(
          "[useRealtimeNotifications] Error deleting notifications:",
          err,
        );
        throw err;
      }
    },
    [fetchNotifications],
  );

  const clearAllRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear all read notifications");
      }

      if (isMountedRef.current) {
        // Remove all read notifications from state
        setNotifications((prev) =>
          prev.filter((notification) => !notification.isRead),
        );
        // Refetch to get updated data
        fetchNotifications();
      }
    } catch (err) {
      console.error(
        "[useRealtimeNotifications] Error clearing read notifications:",
        err,
      );
      throw err;
    }
  }, [fetchNotifications]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Start polling
  useEffect(() => {
    if (!shouldEnablePolling) {
      // If polling should not be enabled, clear any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Setup polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [shouldEnablePolling, pollingInterval, fetchNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    clearAllRead,
    refetch,
  };
}
