"use client";

import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";

interface UseOnlineStatusReturn {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  getOnlineUsersInRoom: (roomId: string) => string[];
  refreshOnlineStatus: (roomId: string) => void;
}

export function useOnlineStatus(socket: Socket | null): UseOnlineStatusReturn {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Check if a user is online
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers],
  );

  // Get online users in a specific room
  const getOnlineUsersInRoom = useCallback(
    (roomId: string) => {
      // This would need to be implemented with room-specific tracking
      // For now, we'll return all online users
      return Array.from(onlineUsers);
    },
    [onlineUsers],
  );

  // Refresh online status for a room
  const refreshOnlineStatus = useCallback(
    (roomId: string) => {
      if (socket) {
        socket.emit("get-online-users", { roomId });
      }
    },
    [socket],
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle user coming online
    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    // Handle user going offline
    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    // Handle online users list
    const handleOnlineUsersList = ({ userIds }: { userIds: string[] }) => {
      setOnlineUsers(new Set(userIds));
    };

    // Listen to socket events
    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);
    socket.on("online-users-list", handleOnlineUsersList);

    // Cleanup
    return () => {
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
      socket.off("online-users-list", handleOnlineUsersList);
    };
  }, [socket]);

  return {
    onlineUsers,
    isUserOnline,
    getOnlineUsersInRoom,
    refreshOnlineStatus,
  };
}
