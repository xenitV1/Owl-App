"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface ChatUser {
  userId: string;
  username: string;
}

interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
}

interface OnlineUsersList {
  roomId: string;
  userIds: string[];
}

interface UseChatReturn {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  isConnected: boolean;
  joinRooms: (roomIds: string[]) => void;
  sendMessage: (data: {
    roomId: string;
    content: string;
    messageType?: string;
    attachmentUrl?: string;
  }) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  deleteMessage: (messageId: string, roomId: string) => void;
  getOnlineUsers: (roomId: string) => void;
}

export function useChat(): UseChatReturn {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(
    new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const chatRoomsRef = useRef<string[]>([]); // Ref to store joined rooms

  useEffect(() => {
    if (!session?.user?.id) return;

    // Initialize socket connection
    const chatSocket = io("/chat", {
      path: "/api/socketio",
      auth: {
        userId: session.user.id,
        token: session.user.id, // Simplified auth for now
      },
      // Stabilizasyon ayarları
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket"], // Sadece websocket kullan, polling'i devre dışı bırak
    });

    // Connection events
    chatSocket.on("connect", () => {
      console.log("[useChat] Connected to chat namespace");
      console.log("[useChat] Socket ID:", chatSocket.id);
      setIsConnected(true);

      // Bağlantı kurulduğunda odalara tekrar join ol
      // Bu, yeniden bağlanma durumlarında kritik önem taşıyor
      if (chatRoomsRef.current.length > 0) {
        console.log(
          "[useChat] Re-joining rooms after reconnection:",
          chatRoomsRef.current,
        );
        chatSocket.emit("join-rooms", chatRoomsRef.current);
      }
    });

    chatSocket.on("disconnect", () => {
      console.log("[useChat] Disconnected from chat namespace");
      setIsConnected(false);
    });

    chatSocket.on("connect_error", (error) => {
      console.error("[useChat] Connection error:", error);
      setIsConnected(false);
    });

    // User online/offline events
    chatSocket.on("user-online", ({ userId, username }: ChatUser) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    chatSocket.on("user-offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Typing indicator events
    chatSocket.on("user-typing", ({ userId, username, roomId }: TypingUser) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const roomTyping = next.get(roomId) || new Set();
        roomTyping.add(username); // userId yerine username ekle
        next.set(roomId, roomTyping);
        return next;
      });

      // Clear existing timeout for this user
      const timeoutKey = `${roomId}-${userId}`;
      const existingTimeout = typingTimeouts.current.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to clear typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const roomTyping = next.get(roomId);
          if (roomTyping) {
            roomTyping.delete(username); // userId yerine username sil
            if (roomTyping.size === 0) {
              next.delete(roomId);
            } else {
              next.set(roomId, roomTyping);
            }
          }
          return next;
        });
        typingTimeouts.current.delete(timeoutKey);
      }, 3000);

      typingTimeouts.current.set(timeoutKey, timeout);
    });

    chatSocket.on(
      "user-stop-typing",
      ({
        userId,
        username,
        roomId,
      }: {
        userId: string;
        username: string;
        roomId: string;
      }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const roomTyping = next.get(roomId);
          if (roomTyping) {
            roomTyping.delete(username); // username'i sil
            if (roomTyping.size === 0) {
              next.delete(roomId);
            } else {
              next.set(roomId, roomTyping);
            }
          }
          return next;
        });

        // Clear timeout
        const timeoutKey = `${roomId}-${userId}`;
        const timeout = typingTimeouts.current.get(timeoutKey);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeouts.current.delete(timeoutKey);
        }
      },
    );

    // Online users list
    chatSocket.on(
      "online-users-list",
      ({ roomId, userIds }: OnlineUsersList) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          userIds.forEach((userId) => next.add(userId));
          return next;
        });
      },
    );

    setSocket(chatSocket);

    // Cleanup function
    return () => {
      // Clear all timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();

      chatSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [session?.user?.id]);

  const joinRooms = (roomIds: string[]) => {
    if (socket && isConnected) {
      socket.emit("join-rooms", roomIds);
      chatRoomsRef.current = roomIds; // Update ref
    }
  };

  const sendMessage = (data: {
    roomId: string;
    content: string;
    messageType?: string;
    attachmentUrl?: string;
  }) => {
    if (socket && isConnected) {
      console.log("[useChat] Sending message:", data);
      socket.emit("send-message", {
        ...data,
        messageType: data.messageType || "text",
      });
    } else {
      console.warn("[useChat] Cannot send message - socket not connected");
    }
  };

  const startTyping = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit("typing-start", { roomId });
    }
  };

  const stopTyping = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit("typing-stop", { roomId });
    }
  };

  const deleteMessage = (messageId: string, roomId: string) => {
    if (socket && isConnected) {
      console.log("[useChat] Deleting message:", { messageId, roomId });
      socket.emit("delete-message", { messageId, roomId });
    } else {
      console.warn("[useChat] Cannot delete message - socket not connected");
    }
  };

  const getOnlineUsers = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit("get-online-users", { roomId });
    }
  };

  return {
    socket,
    onlineUsers,
    typingUsers,
    isConnected,
    joinRooms,
    sendMessage,
    startTyping,
    stopTyping,
    deleteMessage,
    getOnlineUsers,
  };
}
