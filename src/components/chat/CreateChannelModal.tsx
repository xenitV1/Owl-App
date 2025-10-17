"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Lock, Hash, MessageCircle } from "lucide-react";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useChat } from "@/hooks/useChat";

const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  communityId: z.string().min(1, "Community is required"),
  isPrivate: z.boolean(),
  isSubChannel: z.boolean().default(false),
  parentChannelId: z.string().optional(),
  targetUserId: z.string().optional(),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelModal({
  open,
  onOpenChange,
}: CreateChannelModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [parentChannels, setParentChannels] = useState<any[]>([]);

  const { createRoom } = useChatRooms(null);
  const { socket } = useChat();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      isSubChannel: false,
    },
  });

  const isPrivate = watch("isPrivate");
  const isSubChannel = watch("isSubChannel");
  const communityId = watch("communityId");

  // Fetch user's communities
  useEffect(() => {
    if (open) {
      fetchCommunities();
    }
  }, [open]);

  // Fetch parent channels when community is selected
  useEffect(() => {
    if (open && communityId && isSubChannel) {
      fetchParentChannels();
    }
  }, [open, communityId, isSubChannel]);

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities");
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchParentChannels = async () => {
    try {
      const response = await fetch(
        `/api/chat/rooms?communityId=${communityId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setParentChannels(data.rooms || []);
      }
    } catch (error) {
      console.error("Error fetching parent channels:", error);
    }
  };

  const onSubmit = async (data: CreateChannelForm) => {
    setIsCreating(true);
    try {
      const roomData = {
        communityId: data.communityId,
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
        isSubChannel: data.isSubChannel,
        parentChannelId: data.isSubChannel ? data.parentChannelId : undefined,
        allowedUserId: data.isPrivate ? data.targetUserId : undefined,
        maxMembers: data.isPrivate ? 2 : 300,
      };

      const newRoom = await createRoom(roomData);

      if (newRoom && data.isPrivate && data.targetUserId) {
        // Generate invite link for private channel
        const inviteResponse = await fetch("/api/chat/invite-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatRoomId: newRoom.id,
            targetUsername: targetUser?.username,
          }),
        });

        if (inviteResponse.ok) {
          const inviteData = await inviteResponse.json();
          setInviteLink(inviteData.inviteLink);
        }
      }

      if (newRoom) {
        reset();
        onOpenChange(false);
        setInviteLink(null);
      }
    } catch (error) {
      console.error("Error creating channel:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    reset();
    setInviteLink(null);
    setTargetUser(null);
    setParentChannels([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPrivate ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Hash className="h-5 w-5" />
            )}
            Create {isPrivate ? "Private" : "Public"} Channel
          </DialogTitle>
          <DialogDescription>
            {isPrivate
              ? "Create a private channel for direct communication with another user."
              : "Create a public channel for community discussions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          {/* Channel Type Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isPrivate">Private Channel</Label>
            <Switch
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={(checked) => setValue("isPrivate", checked)}
            />
          </div>

          {/* Sub Channel Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isSubChannel">Sub Channel</Label>
            <Switch
              id="isSubChannel"
              checked={isSubChannel}
              onCheckedChange={(checked) => setValue("isSubChannel", checked)}
            />
          </div>

          {/* Community Selection */}
          <div className="space-y-2">
            <Label htmlFor="communityId">Community</Label>
            <Select onValueChange={(value) => setValue("communityId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={community.avatar} />
                        <AvatarFallback>
                          {community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{community.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.communityId && (
              <p className="text-sm text-destructive">
                {errors.communityId.message}
              </p>
            )}
          </div>

          {/* Target User Selection (Private only) */}
          {isPrivate && (
            <div className="space-y-2">
              <Label htmlFor="targetUser">Target User</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                {targetUser ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={targetUser.avatar} />
                      <AvatarFallback>
                        {targetUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{targetUser.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {targetUser.username}
                    </Badge>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Select a user to invite
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implement user selection modal
                  console.log("User selection clicked");
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Select User
              </Button>
            </div>
          )}

          {/* Parent Channel Selection (Sub Channel only) */}
          {isSubChannel && (
            <div className="space-y-2">
              <Label htmlFor="parentChannelId">Parent Channel</Label>
              <Select
                onValueChange={(value) => setValue("parentChannelId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent channel" />
                </SelectTrigger>
                <SelectContent>
                  {parentChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      <div className="flex items-center gap-2">
                        {channel.isMainChat ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : channel.isPrivate ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Hash className="h-4 w-4" />
                        )}
                        <span>{channel.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.parentChannelId && (
                <p className="text-sm text-destructive">
                  {errors.parentChannelId.message}
                </p>
              )}
            </div>
          )}

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter channel name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter channel description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Invite Link Display */}
          {inviteLink && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <Label>Invite Link</Label>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
