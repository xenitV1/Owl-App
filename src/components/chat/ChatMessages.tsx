"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";

interface ChatMessagesProps {
  roomId: string;
  socket: Socket | null;
  typingUsers?: Set<string>;
}

// Loading animasyonu varyantları
const loadingVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

// Loading dot animasyonu
const loadingDotVariants = {
  initial: { scale: 0 },
  animate: {
    scale: [0, 1, 0],
    transition: {
      duration: 1.4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// Modern Loading Component
function ModernLoading() {
  return (
    <motion.div
      variants={loadingVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center h-full space-y-4"
    >
      <div className="flex items-center space-x-2">
        <motion.div
          variants={loadingDotVariants}
          initial="initial"
          animate="animate"
          className="w-3 h-3 bg-primary rounded-full"
        />
        <motion.div
          variants={loadingDotVariants}
          initial="initial"
          animate="animate"
          className="w-3 h-3 bg-primary rounded-full"
          style={{ animationDelay: "0.2s" }}
        />
        <motion.div
          variants={loadingDotVariants}
          initial="initial"
          animate="animate"
          className="w-3 h-3 bg-primary rounded-full"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground"
      >
        Loading messages...
      </motion.p>
    </motion.div>
  );
}

// Empty state animasyonu
const emptyStateVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function ChatMessages({
  roomId,
  socket,
  typingUsers,
}: ChatMessagesProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    deleteMessage,
    error,
    setError,
    messageBlocked,
    blockReason,
  } = useChatMessages(roomId, socket);
  const { isConnected } = useChat();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Konteyner genişliğini takip et
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    // MutationObserver ile konteyner boyut değişikliklerini takip et
    const observer = new MutationObserver(updateWidth);
    if (parentRef.current) {
      observer.observe(parentRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener("resize", updateWidth);
      observer.disconnect();
    };
  }, []);

  // Konteyner genişliğine göre mesaj boyutunu dinamik ayarla
  const getMessageMaxWidth = useCallback(() => {
    if (containerWidth < 400) return "100%";
    if (containerWidth < 600) return "90%";
    if (containerWidth < 800) return "85%";
    return "80%";
  }, [containerWidth]);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      // Konteyner genişliğine göre dinamik mesaj yüksekliği
      if (containerWidth < 400) return 80; // Dar ekranlarda daha yüksek
      if (containerWidth < 600) return 70;
      return 60; // Geniş ekranlarda standart
    },
    overscan: 5,
  });

  // Kullanıcının scroll durumunu takip et
  const handleUserScroll = useCallback(() => {
    if (parentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 300;
      setUserScrolled(!isAtBottom);

      // Kullanıcı en alta scroll yaparsa yeni mesaj bildirimini gizle
      if (isAtBottom && hasNewMessages) {
        setHasNewMessages(false);
      }
    }
  }, [hasNewMessages]);

  // Auto-scroll to bottom on new messages (only if user is at bottom)
  useEffect(() => {
    if (parentRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      // Threshold'ı artırıp daha esnek hale getirdim
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 300;

      if (isAtBottom) {
        // Smooth scroll to bottom
        parentRef.current.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else if (!isInitialLoad) {
        // Kullanıcı en altta değilse yeni mesaj bildirimi göster
        setHasNewMessages(true);
      }
    }
  }, [messages.length, isInitialLoad]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (parentRef.current && messages.length > 0 && isInitialLoad && !loading) {
      // En son mesaja smooth scroll et
      setTimeout(() => {
        rowVirtualizer.scrollToIndex(messages.length - 1, { align: "end" });
        setIsInitialLoad(false);
      }, 100);
    }
  }, [messages.length, isInitialLoad, loading, rowVirtualizer]);

  // Yeni mesaj gönderildiğinde her zaman en alta scroll
  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior: "smooth",
      });
      setHasNewMessages(false);
      setUserScrolled(false);
    }
  }, []);

  // Yeni mesajları gör butonu
  const scrollToNewMessages = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Infinite scroll (load older messages)
  const handleScroll = () => {
    handleUserScroll(); // Kullanıcı scroll durumunu güncelle

    if (parentRef.current?.scrollTop === 0 && hasMore && !loading) {
      // Eski mesajlar yüklenirken mevcut scroll pozisyonunu koru
      const currentScrollHeight = parentRef.current.scrollHeight;
      const currentScrollTop = parentRef.current.scrollTop;

      loadMore().then(() => {
        // Yeni mesajlar yüklendikten sonra scroll pozisyonunu geri yükle
        if (parentRef.current) {
          const newScrollHeight = parentRef.current.scrollHeight;
          const scrollDifference = newScrollHeight - currentScrollHeight;
          parentRef.current.scrollTop = currentScrollTop + scrollDifference;
        }
      });
    }
  };

  const handleSendMessage = async (
    content: string,
    messageType = "text",
    attachmentUrl?: string,
  ) => {
    // Doğrudan socket üzerinden mesaj gönder
    if (socket && isConnected) {
      socket.emit("send-message", {
        roomId,
        content: content.trim(),
        messageType,
        attachmentUrl,
      });

      // Mesaj gönderildikten sonra her zaman en alta scroll
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } else {
      console.error(
        "[ChatMessages] Cannot send message - socket not connected",
      );
      setError("Connection error. Please check your internet connection.");
    }
  };

  // Handle reply to message
  const handleReply = useCallback(async (messageId: string) => {
    // Scroll to message being replied to
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight message temporarily
      messageElement.classList.add("bg-primary/10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary/10");
      }, 2000);
    }

    // Focus on input field
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.focus();
    }
  }, []);

  // Send image message
  const sendImageMessage = async (file: File) => {
    try {
      // In a real implementation, you would upload file to a server
      // and get back a URL. For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);

      // Send message with image
      await handleSendMessage("Shared an image", "image", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message Blocked Warning */}
      <AnimatePresence>
        {messageBlocked && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-red-50 border border-red-200 text-red-800"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Message Blocked</span>
            </div>
            <p className="text-sm mt-1">{blockReason}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4"
        style={{
          contain: "strict",
          scrollBehavior: "smooth",
        }}
      >
        <AnimatePresence mode="wait">
          {loading && messages.length === 0 && <ModernLoading />}

          {messages.length === 0 && !loading && (
            <motion.div
              variants={emptyStateVariants}
              initial="initial"
              animate="animate"
              className="flex flex-col items-center justify-center h-full text-muted-foreground"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="mb-4"
              >
                <MessageCircle className="h-16 w-16" />
              </motion.div>
              <div className="text-center space-y-2">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-medium"
                >
                  No messages yet
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm"
                >
                  Be the first to start the conversation!
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length > 0 && (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = messages[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  data-message-id={message.id} // Add this for reply functionality
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatMessage
                    message={message}
                    onDelete={deleteMessage}
                    onReply={handleReply} // Pass reply function
                    maxWidth={getMessageMaxWidth()} // Dinamik maksimum genişlik
                  />
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {loading && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center py-2"
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <span className="text-sm text-muted-foreground">
                  Loading more messages...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Yeni Mesajlar Butonu */}
      <AnimatePresence>
        {hasNewMessages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10"
          >
            <Button
              onClick={scrollToNewMessages}
              size="sm"
              className="shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <div className="flex items-center space-x-2">
                <span>Yeni mesajlar</span>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7l-5 5" />
                  </svg>
                </motion.div>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      {typingUsers && typingUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-2"
        >
          <ChatTypingIndicator users={Array.from(typingUsers)} />
        </motion.div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={() => socket?.emit("typing-start", { roomId })}
          onStopTyping={() => socket?.emit("typing-stop", { roomId })}
          disabled={!socket}
        />
      </div>
    </div>
  );
}
