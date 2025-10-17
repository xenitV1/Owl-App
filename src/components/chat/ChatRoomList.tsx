"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Users,
  MessageCircle,
  Hash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatRoom {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  isMainChat: boolean;
  isPrivate: boolean;
  isPublic: boolean;
  maxMembers: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  isSubChannel?: boolean;
  parentChannelId?: string;
  parentChannel?: ChatRoom;
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

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

export function ChatRoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onlineUsers,
  isUserOnline,
}: ChatRoomListProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [expandedCommunities, setExpandedCommunities] = useState<
    Record<string, boolean>
  >({});

  // Load expanded communities from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chat-expanded-communities");
      if (saved) {
        try {
          setExpandedCommunities(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to parse expanded communities:", error);
        }
      }
    }
  }, []);

  // Save expanded communities to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "chat-expanded-communities",
        JSON.stringify(expandedCommunities),
      );
    }
  }, [expandedCommunities]);

  // Group rooms by community
  const groupedRooms = rooms.reduce(
    (acc, room) => {
      const communityName = room.community.name;
      if (!acc[communityName]) {
        acc[communityName] = [];
      }
      acc[communityName].push(room);
      return acc;
    },
    {} as Record<string, ChatRoom[]>,
  );

  // Sort rooms within each community (main chat first, then by creation date)
  Object.keys(groupedRooms).forEach((communityName) => {
    groupedRooms[communityName].sort((a, b) => {
      // Main channels first
      if (a.isMainChat && !b.isMainChat) return -1;
      if (!a.isMainChat && b.isMainChat) return 1;

      // Then sort by parent-child relationship
      if (a.parentChannelId && !b.parentChannelId) return 1;
      if (!a.parentChannelId && b.parentChannelId) return -1;
      if (
        a.parentChannelId &&
        b.parentChannelId &&
        a.parentChannelId !== b.parentChannelId
      ) {
        return a.parentChannelId.localeCompare(b.parentChannelId);
      }

      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  const toggleCommunity = (communityName: string) => {
    setExpandedCommunities((prev) => ({
      ...prev,
      [communityName]: !prev[communityName],
    }));
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.isMainChat) {
      return <MessageCircle className="h-4 w-4" />;
    }
    if (room.isPrivate) {
      return <Lock className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const getOnlineMemberCount = (room: ChatRoom) => {
    return room.members.filter((member) => isUserOnline(member.user.id)).length;
  };

  return (
    <div className="space-y-1">
      {Object.entries(groupedRooms).map(([communityName, communityRooms]) => {
        const isExpanded = expandedCommunities[communityName] ?? true;

        return (
          <div key={communityName} className="mb-1">
            {/* Community Header - Clickable to toggle */}
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2 text-left hover:bg-accent hover:text-accent-foreground"
              onClick={() => toggleCommunity(communityName)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {communityName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {communityRooms.length}
                  </Badge>
                </div>
              </div>
            </Button>

            {/* Rooms in Community - Only show if expanded */}
            {isExpanded && (
              <div className="space-y-1 ml-1">
                {communityRooms.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  const onlineCount = getOnlineMemberCount(room);
                  const hasUnread = false; // TODO: Implement unread message tracking
                  const isSubChannel = room.isSubChannel;

                  return (
                    <div key={room.id} className={isSubChannel ? "ml-3" : ""}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-auto p-1.5 text-left",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground",
                        )}
                        onClick={() => onSelectRoom(room.id)}
                        onMouseEnter={() => setHoveredRoom(room.id)}
                        onMouseLeave={() => setHoveredRoom(null)}
                      >
                        <div className="flex items-center gap-1.5 w-full min-w-0">
                          {/* Room Icon */}
                          <div className="flex-shrink-0 text-muted-foreground">
                            {getRoomIcon(room)}
                          </div>

                          {/* Room Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">
                                {room.name}
                              </span>
                              {room.isMainChat && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0"
                                >
                                  Main
                                </Badge>
                              )}
                              {room.isPrivate && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  Private
                                </Badge>
                              )}
                              {isSubChannel && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  Sub
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{room._count.members}</span>
                                {onlineCount > 0 && (
                                  <span className="text-green-600">
                                    ({onlineCount})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Unread Badge */}
                          {hasUnread && (
                            <div className="flex-shrink-0">
                              <Badge
                                variant="destructive"
                                className="text-xs w-1.5 h-1.5 p-0 rounded-full"
                              />
                            </div>
                          )}
                        </div>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
