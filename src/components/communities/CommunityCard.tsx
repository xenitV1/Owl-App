"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Plus, Check } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { getGradeDisplay } from "@/utils/userProfile";
import { getCountryFlagUrl } from "@/lib/utils";
// Flag shown directly as avatar image when country is available

interface CommunityMember {
  id: string;
  role: string;
  user: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  members: CommunityMember[];
  _count: {
    members: number;
    posts: number;
  };
  country?: string | null;
  grade?: string | null;
  isSystemGenerated?: boolean;
}

interface CommunityCardProps {
  community: Community;
  currentUserId?: string;
  isMember?: boolean;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
  onView?: (communityId: string) => void;
  locale?: string;
}

export function CommunityCard({
  community,
  currentUserId,
  isMember = false,
  onJoin,
  onLeave,
  onView,
  locale = "en",
}: CommunityCardProps) {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleJoin = async () => {
    if (!onJoin) return;

    setIsJoining(true);
    try {
      await onJoin(community.id);
      toast({
        title: "Joined Community",
        description: `You have successfully joined ${community.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;

    setIsLeaving(true);
    try {
      await onLeave(community.id);
      toast({
        title: "Left Community",
        description: `You have left ${community.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(community.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get country information
  const getCountryInfo = () => {
    if (!community.country) return null;
    const code = community.country.toUpperCase();
    return COUNTRIES.find((c) => c.code === code);
  };

  const countryInfo = getCountryInfo();
  const gradeDisplay = community.grade
    ? getGradeDisplay(community.grade, locale)
    : null;

  return (
    <Card
      className="h-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={getCountryFlagUrl(community.country) || community.avatar}
              alt={community.name}
              className="object-cover"
            />
            <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-6 truncate">
              {community.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={community.isPublic ? "default" : "secondary"}>
                {community.isPublic ? "Public" : "Private"}
              </Badge>
              {community.isSystemGenerated && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Created {formatDate(community.createdAt)}
              </span>
            </div>
            {/* Country and Grade Display */}
            {(countryInfo || gradeDisplay) && (
              <div className="flex items-center gap-2 mt-2">
                {countryInfo && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{countryInfo.name}</span>
                  </div>
                )}
                {countryInfo && gradeDisplay && (
                  <span className="text-sm text-muted-foreground">•</span>
                )}
                {gradeDisplay && (
                  <span className="text-sm text-muted-foreground">
                    {gradeDisplay}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {community.description && (
          <CardDescription className="mb-4 line-clamp-2">
            {community.description}
          </CardDescription>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{community._count.members}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{community._count.posts}</span>
            </div>
          </div>
        </div>

        {currentUserId && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {isMember ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeave}
                disabled={isLeaving}
                className="flex-1"
              >
                {isLeaving ? (
                  "Leaving..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Joined
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={isJoining}
                className="flex-1"
              >
                {isJoining ? (
                  "Joining..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Join
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
