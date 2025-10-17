"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  reactions?: string;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    username?: string; // Add username field
    avatar?: string;
  };
}

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  sendMessage: (
    content: string,
    messageType?: string,
    attachmentUrl?: string,
  ) => Promise<void>;
  loadMore: () => Promise<void>;
  deleteMessage: (messageId: string) => void;
  refreshMessages: () => Promise<void>;
  messageBlocked: boolean;
  blockReason: string | null;
}

export function useChatMessages(
  roomId: string | null,
  socket: Socket | null,
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageBlocked, setMessageBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  // Fetch messages from API
  const fetchMessages = useCallback(
    async (page = 1, before?: string) => {
      if (!roomId) return;

      try {
        setError(null);

        if (page === 1) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "50",
        });

        if (before) {
          params.append("before", before);
        }

        const response = await fetch(
          `/api/chat/rooms/${roomId}/messages?${params}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();

        if (page === 1) {
          setMessages(data.messages);
        } else {
          // Prepend older messages
          setMessages((prev) => [...data.messages, ...prev]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch messages",
        );
        console.error("[useChatMessages] Error fetching messages:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [roomId],
  );

  // Load more messages (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    await fetchMessages(2, oldestMessage.createdAt);
  }, [hasMore, isLoadingMore, messages, fetchMessages]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await fetchMessages(1);
  }, [fetchMessages]);

  // Send message - API üzerinden değil, sadece socket üzerinden gönderilecek
  const sendMessage = useCallback(
    async (content: string, messageType = "text", attachmentUrl?: string) => {
      // Bu fonksiyon artık API üzerinden değil, doğrudan socket üzerinden mesaj gönderiyor
      // Socket gönderme işlemi ChatMessages.tsx bileşeninde yapılıyor
      // Bu fonksiyon sadece uyumluluk için tutuluyor, aslında kullanılmıyor
      console.log(
        "[useChatMessages] sendMessage should be called via socket, not API",
      );
    },
    [roomId],
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket) return;

      socket.emit("delete-message", { messageId, roomId });
    },
    [socket, roomId],
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket || !roomId) return;

    // Handle new message - CRITICAL: Real-time mesajlaşma için gerekli!
    const handleNewMessage = (message: ChatMessage) => {
      console.log(
        "[useChatMessages] New message received via socket:",
        message,
      );
      if (message.chatRoomId === roomId) {
        setMessages((prev) => {
          // Aynı mesaj zaten varsa duplicate ekleme
          const messageExists = prev.some((msg) => msg.id === message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
        setError(null);
      }
    };

    // Handle message deletion
    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      console.log("[useChatMessages] Message deleted:", messageId);
      // Remove the message from state completely instead of marking it as deleted
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    // Handle message blocked
    const handleMessageBlocked = ({ reason }: { reason: string }) => {
      console.log("[useChatMessages] Message blocked:", reason);
      setMessageBlocked(true);
      setBlockReason(reason);

      // Auto-clear the blocked message notification after 5 seconds
      setTimeout(() => {
        setMessageBlocked(false);
        setBlockReason(null);
      }, 5000);
    };

    // Listen to socket events - CRITICAL: new-message listener'ı geri ekliyoruz!
    socket.on("new-message", handleNewMessage);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("message-blocked", handleMessageBlocked);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("message-blocked", handleMessageBlocked);
    };
  }, [socket, roomId]);

  // Custom event listener removed - API response handling is done directly in sendMessage
  // useEffect(() => {
  //   if (!roomId) return;

  //   // Listen for API response events (when message is sent via API)
  //   const handleApiMessageResponse = (event: CustomEvent) => {
  //     const { message } = event.detail;
  //     if (message && message.chatRoomId === roomId) {
  //       console.log('[useChatMessages] API message response received:', message);
  //       setMessages(prev => [...prev, message]);
  //       setError(null);
  //     }
  //   };

  //   // Add event listener for API responses
  //   window.addEventListener('chat-message-sent', handleApiMessageResponse as EventListener);

  //   return () => {
  //     window.removeEventListener('chat-message-sent', handleApiMessageResponse as EventListener);
  //   };
  // }, [roomId]);

  // Initial load
  useEffect(() => {
    if (roomId) {
      fetchMessages(1);
    } else {
      setMessages([]);
      setHasMore(true);
      setError(null);
    }
  }, [roomId, fetchMessages]);

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      messages,
      loading,
      hasMore,
      error,
      setError,
      sendMessage,
      loadMore,
      deleteMessage,
      refreshMessages,
      messageBlocked,
      blockReason,
    }),
    [
      messages,
      loading,
      hasMore,
      error,
      sendMessage,
      loadMore,
      deleteMessage,
      refreshMessages,
      messageBlocked,
      blockReason,
    ],
  );

  return returnValue;
}
