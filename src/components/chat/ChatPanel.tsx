"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Plus,
  Users,
  Settings,
  GripVertical,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { ChatRoomList } from "./ChatRoomList";
import { ChatMessages } from "./ChatMessages";
import { CreateChannelModal } from "./CreateChannelModal";
import { ChatSettings } from "./ChatSettings";
import { useChat } from "@/hooks/useChat";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Varsayılan ve minimum genişlikler
const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const COLLAPSED_WIDTH = 50;

export function ChatPanel({ isOpen, onOpenChange }: ChatPanelProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideRoomList, setHideRoomList] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const { socket, onlineUsers, typingUsers, isConnected } = useChat();
  const { chatRooms, loading: roomsLoading } = useChatRooms(socket);
  const { isUserOnline } = useOnlineStatus(socket);

  // LocalStorage'dan kaydedilmiş genişliği yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("chat-panel-width");
      const savedCollapsed = localStorage.getItem("chat-panel-collapsed");

      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
          setPanelWidth(width);
        }
      }

      if (savedCollapsed) {
        setIsCollapsed(savedCollapsed === "true");
      }
    }
  }, []);

  // Genişlik değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-panel-width", panelWidth.toString());

      // Dispatch custom event to notify about width change
      const event = new CustomEvent("chat-panel-width-change", {
        detail: { width: panelWidth },
      });
      window.dispatchEvent(event);
    }
  }, [panelWidth]);

  // Collapsed durumunu LocalStorage'a kaydet
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-panel-collapsed", isCollapsed.toString());

      // Dispatch custom event to notify about collapsed state change
      const event = new CustomEvent("chat-panel-collapsed-change", {
        detail: { collapsed: isCollapsed },
      });
      window.dispatchEvent(event);
    }
  }, [isCollapsed]);

  // Room list visibility persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHideList = localStorage.getItem("chat-hide-room-list");
      if (savedHideList) {
        setHideRoomList(savedHideList === "true");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-hide-room-list", hideRoomList.toString());
    }
  }, [hideRoomList]);

  // Join rooms on socket connection or when rooms are loaded
  useEffect(() => {
    if (socket && isConnected && chatRooms.length > 0) {
      const roomIds = chatRooms.map((r) => r.id);
      console.log("[ChatPanel] Joining rooms:", roomIds);
      socket.emit("join-rooms", roomIds);
    }
  }, [socket, isConnected, chatRooms]);

  // Auto-select first room if none selected
  useEffect(() => {
    if (!selectedRoomId && chatRooms.length > 0) {
      setSelectedRoomId(chatRooms[0].id);
    }
  }, [selectedRoomId, chatRooms]);

  // Sürükleme işlemleri
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Ekranın sol kenarından başlayarak hesapla
      const newWidth = e.clientX;

      // Minimum ve maksimum genişlik sınırlarını uygula
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const selectedRoom = chatRooms.find((room) => room.id === selectedRoomId);
  const typingUsersInRoom = selectedRoomId
    ? typingUsers.get(selectedRoomId)
    : undefined;

  // Panel tamamen kapalıysa hiçbir şey gösterme
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Chat Panel (Fixed Left Sidebar) */}
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100%-64px)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r z-40 transition-all duration-300",
          isCollapsed ? "w-[50px]" : "",
          "lg:block", // Always show on large screens
          "hidden", // Hidden by default, shown on medium screens when open
          isOpen && "md:block", // Show on medium screens when open
        )}
        style={{
          width: isCollapsed ? COLLAPSED_WIDTH : `${panelWidth}px`,
          maxWidth: "100vw",
          transition: isResizing ? "none" : "width 0.2s ease",
          backgroundColor: "var(--chat-background-color)",
        }}
      >
        {/* Panel Header */}
        <div
          className="p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between"
          style={{ backgroundColor: "var(--chat-background-color)" }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Chat</span>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHideRoomList((prev) => !prev)}
                className="h-5 w-5"
                title={hideRoomList ? "Show room list" : "Hide room list"}
              >
                {hideRoomList ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-5 w-5"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            {!isCollapsed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateChannel(true)}
                  className="h-5 w-5"
                  title="Create Channel"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatSettings(true)}
                  className="h-5 w-5"
                  title="Chat Settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-5 w-5"
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div
            className="flex h-[calc(100%-60px)] overflow-hidden"
            style={{ backgroundColor: "var(--chat-background-color)" }}
          >
            {/* Room List (Left) */}
            {!hideRoomList && (
              <div
                className="w-2/5 border-r bg-muted/20 flex flex-col"
                style={{ backgroundColor: "var(--chat-background-color)" }}
              >
                <div className="p-1 border-b">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Rooms ({chatRooms.length})</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {roomsLoading ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      Loading rooms...
                    </div>
                  ) : chatRooms.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No chat rooms available
                    </div>
                  ) : (
                    <ChatRoomList
                      rooms={chatRooms}
                      selectedRoomId={selectedRoomId}
                      onSelectRoom={setSelectedRoomId}
                      onlineUsers={onlineUsers}
                      isUserOnline={isUserOnline}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Messages (Right) */}
            <div
              className={cn(
                "flex flex-col",
                hideRoomList ? "flex-1" : "flex-1",
              )}
            >
              {selectedRoom ? (
                <>
                  {/* Room Header */}
                  <div
                    className="p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    style={{ backgroundColor: "var(--chat-background-color)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {selectedRoom.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{selectedRoom._count.members} members</span>
                          {selectedRoom.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                          {selectedRoom.isMainChat && (
                            <Badge variant="default" className="text-xs">
                              Main
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Room Settings"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div
                    className="flex-1 overflow-hidden"
                    style={{ backgroundColor: "var(--chat-background-color)" }}
                  >
                    <ChatMessages
                      roomId={selectedRoom.id}
                      socket={socket}
                      typingUsers={typingUsersInRoom}
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Select a chat room to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            ref={resizeHandleRef}
            onMouseDown={startResizing}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize bg-transparent hover:bg-primary/20 transition-colors",
              isResizing && "bg-primary/40",
            )}
            title="Drag to resize"
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
      />

      {/* Chat Settings Modal */}
      <ChatSettings
        isOpen={showChatSettings}
        onOpenChange={setShowChatSettings}
      />
    </>
  );
}
