"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCountryFlagUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Trash2,
  Reply,
  Smile,
  Image,
  File,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLocale } from "next-intl";

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
  securityWarnings?: string[]; // Güvenlik uyarıları için yeni alan
  replyToId?: string; // Yanıt verilen mesaj ID'si
  replyTo?: ChatMessage; // Yanıt verilen mesajın tam içeriği
  sender: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
}

interface ChatMessageProps {
  message: ChatMessage;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void; // Reply fonksiyonu eklendi
  maxWidth?: string; // Dinamik maksimum genişlik için prop
}

// Mesaj animasyon varyantları
const messageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};

// Silme animasyonu varyantları
const deleteVariants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    height: 0,
    margin: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};

export function ChatMessage({
  message,
  onDelete,
  onReply,
  maxWidth = "70%",
}: ChatMessageProps) {
  const { data: session } = useSession();
  const locale = useLocale();
  const [showReactions, setShowReactions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnMessage = session?.user?.id === message.senderId;
  const isDeleted = message.isDeleted;
  const isEdited = message.isEdited && !isDeleted;

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(message.id);
      setShowDropdown(false);
    }, 300); // Animasyon süresi kadar bekle
  };

  const handleReply = () => {
    onReply(message.id);
    setShowDropdown(false);
  };

  // Apply chat settings
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applySettings = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const fontSize =
        computedStyle.getPropertyValue("--chat-font-size") || "14px";
      const fontFamily =
        computedStyle.getPropertyValue("--chat-font-family") || "Inter";
      const messageColorVar = computedStyle.getPropertyValue(
        "--chat-message-color",
      );
      const messageColor =
        messageColorVar && messageColorVar.trim() !== "" ? messageColorVar : "";
      const showAvatars =
        computedStyle.getPropertyValue("--chat-show-avatars") === "1";

      const messageElements = document.querySelectorAll(
        `[data-message-id="${message.id}"] .text-sm`,
      );
      messageElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.fontSize = fontSize;
          el.style.fontFamily =
            fontFamily === "System"
              ? "system-ui, -apple-system, sans-serif"
              : fontFamily;
          if (messageColor) {
            el.style.color = messageColor;
          } else {
            el.style.removeProperty("color");
          }
        }
      });

      const avatarElements = document.querySelectorAll(
        `[data-message-id="${message.id}"] .chat-avatar`,
      );
      avatarElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.display = showAvatars ? "flex" : "none";
        }
      });
    };

    // initial apply
    applySettings();

    // re-apply on settings change
    const handler = () => applySettings();
    window.addEventListener("chat-settings-changed", handler);
    return () => window.removeEventListener("chat-settings-changed", handler);
  }, [message.id]);

  const renderMessageContent = () => {
    if (isDeleted) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground italic text-sm"
        >
          This message was deleted
        </motion.div>
      );
    }

    // Security warnings display
    if (message.securityWarnings && message.securityWarnings.length > 0) {
      return (
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
          >
            <div className="font-medium flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm1-9a1 1 0 00-2 0v4a1 1 0 102 0V5z"
                  clipRule="evenodd"
                />
              </svg>
              Security Warnings:
            </div>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {message.securityWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </motion.div>

          {/* Show the actual message content below warnings */}
          {renderActualMessageContent()}
        </div>
      );
    }

    // If no security warnings, show the actual message content
    return renderActualMessageContent();
  };

  // Helper function to render the actual message content
  const renderActualMessageContent = () => {
    switch (message.messageType) {
      case "image":
        return (
          <div className="space-y-2">
            <motion.img
              src={message.attachmentUrl}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            {message.content && (
              <motion.p
                className="text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {message.content}
              </motion.p>
            )}
          </div>
        );

      case "file":
        return (
          <motion.div
            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <File className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.content || "Shared file"}
              </p>
              {message.attachmentUrl && (
                <a
                  href={message.attachmentUrl}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              )}
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="space-y-1">
            <motion.p
              className="text-sm whitespace-pre-wrap break-words"
              data-message-id={message.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              {message.content}
            </motion.p>
            {isEdited && (
              <motion.span
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                (edited)
              </motion.span>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isDeleting && (
        <motion.div
          key={message.id}
          variants={isDeleting ? deleteVariants : messageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          whileHover="hover"
          className={cn(
            "flex gap-2 p-2 hover:bg-muted/50 transition-colors group",
            isOwnMessage && "flex-row-reverse",
          )}
        >
          {/* Avatar + Username (username above avatar) */}
          <motion.div
            className={cn(
              "flex-shrink-0 flex flex-col items-center",
              isOwnMessage && "order-2",
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            <div className="text-[10px] leading-none text-muted-foreground max-w-[84px] truncate mb-1 text-center">
              {message.sender.name}
            </div>
            <Avatar className="h-8 w-8 chat-avatar">
              <AvatarImage
                src={
                  getCountryFlagUrl((message as any).sender?.country) ||
                  message.sender.avatar
                }
                alt={message.sender.name}
              />
              <AvatarFallback>
                {message.sender.username ||
                  message.sender.name?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Message Content */}
          <div
            className={cn(
              "flex-1 min-w-0 space-y-1",
              isOwnMessage && "order-1",
            )}
          >
            {/* Reply Info */}
            {message.replyTo && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-1 text-xs text-muted-foreground mb-1"
              >
                <Reply className="h-3 w-3" />
                <span>
                  Replying to{" "}
                  {message.replyTo.sender.username ? (
                    <Link
                      href={`/${locale}/profile/${message.replyTo.sender.username}`}
                      className="hover:underline"
                    >
                      {message.replyTo.sender.name}
                    </Link>
                  ) : (
                    message.replyTo.sender.name
                  )}
                </span>
              </motion.div>
            )}

            {/* Meta Info (time + status) */}
            <motion.div
              className={cn(
                "flex items-center gap-1",
                isOwnMessage && "flex-row-reverse",
              )}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {isOwnMessage && !isDeleted && (
                <motion.div
                  className="flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                </motion.div>
              )}
            </motion.div>

            {/* Message Bubble */}
            <motion.div
              variants={{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                hover: { scale: 1.02 },
              }}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className={cn(
                "inline-block p-2 rounded-xl",
                isOwnMessage
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted",
                isDeleted && "opacity-60",
              )}
              style={{ maxWidth }}
            >
              {renderMessageContent()}
            </motion.div>

            {/* Reactions */}
            {message.reactions && !isDeleted && (
              <motion.div
                className="flex flex-wrap gap-1 mt-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* TODO: Implement reactions */}
              </motion.div>
            )}
          </div>

          {/* Message Actions */}
          {!isDeleted && (
            <motion.div
              className={cn(
                "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                isOwnMessage && "order-3",
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  <DropdownMenuItem
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Smile className="h-3 w-3 mr-2" />
                    Add Reaction
                  </DropdownMenuItem>
                  {/* Reply option - only show for other users' messages */}
                  {!isOwnMessage && (
                    <DropdownMenuItem onClick={handleReply}>
                      <Reply className="h-3 w-3 mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  {isOwnMessage && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
