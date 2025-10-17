"use client";

import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";

interface ChatRoom {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  isMainChat: boolean;
  isPrivate: boolean;
  isPublic: boolean;
  maxMembers: number;
  inviteToken?: string;
  allowedUserId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  community: {
    id: string;
    name: string;
    avatar?: string;
    isSystemGenerated: boolean;
    chatEnabled: boolean;
  };
  creator: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  members: Array<{
    id: string;
    userId: string;
    chatRoomId: string;
    role: string;
    joinedAt: string;
    lastReadAt?: string;
    user: {
      id: string;
      name: string;
      username?: string;
      avatar?: string;
    };
  }>;
  _count: {
    messages: number;
    members: number;
  };
}

interface UseChatRoomsReturn {
  chatRooms: ChatRoom[];
  loading: boolean;
  error: string | null;
  createRoom: (data: {
    communityId: string;
    name: string;
    description?: string;
    isPrivate?: boolean;
    allowedUserId?: string;
    maxMembers?: number;
  }) => Promise<ChatRoom | null>;
  updateRoom: (
    roomId: string,
    data: {
      name?: string;
      description?: string;
      maxMembers?: number;
    },
  ) => Promise<ChatRoom | null>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  refreshRooms: () => Promise<void>;
}

export function useChatRooms(socket: Socket | null): UseChatRoomsReturn {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat rooms from API
  const fetchChatRooms = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/chat/rooms");

      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }

      const data = await response.json();
      setChatRooms(data.chatRooms);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch chat rooms",
      );
      console.error("[useChatRooms] Error fetching chat rooms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new chat room
  const createRoom = useCallback(
    async (data: {
      communityId: string;
      name: string;
      description?: string;
      isPrivate?: boolean;
      allowedUserId?: string;
      maxMembers?: number;
    }) => {
      try {
        setError(null);

        const response = await fetch("/api/chat/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create chat room");
        }

        const result = await response.json();

        // Add new room to the list
        setChatRooms((prev) => [result.chatRoom, ...prev]);

        // Join the room via socket
        if (socket) {
          socket.emit("join-rooms", [result.chatRoom.id]);
        }

        return result.chatRoom;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create chat room",
        );
        console.error("[useChatRooms] Error creating chat room:", err);
        return null;
      }
    },
    [socket],
  );

  // Update chat room
  const updateRoom = useCallback(
    async (
      roomId: string,
      data: {
        name?: string;
        description?: string;
        maxMembers?: number;
      },
    ) => {
      try {
        setError(null);

        const response = await fetch(`/api/chat/rooms/${roomId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update chat room");
        }

        const result = await response.json();

        // Update room in the list
        setChatRooms((prev) =>
          prev.map((room) => (room.id === roomId ? result.chatRoom : room)),
        );

        return result.chatRoom;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update chat room",
        );
        console.error("[useChatRooms] Error updating chat room:", err);
        return null;
      }
    },
    [],
  );

  // Delete chat room
  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete chat room");
      }

      // Remove room from the list
      setChatRooms((prev) => prev.filter((room) => room.id !== roomId));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete chat room",
      );
      console.error("[useChatRooms] Error deleting chat room:", err);
      return false;
    }
  }, []);

  // Refresh chat rooms
  const refreshRooms = useCallback(async () => {
    await fetchChatRooms();
  }, [fetchChatRooms]);

  // Initial load
  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Join rooms when socket connects
  useEffect(() => {
    if (socket && chatRooms.length > 0) {
      const roomIds = chatRooms.map((room) => room.id);
      socket.emit("join-rooms", roomIds);
    }
  }, [socket, chatRooms]);

  return {
    chatRooms,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    refreshRooms,
  };
}
