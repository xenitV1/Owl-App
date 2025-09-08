'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, Lock, MessageCircle } from 'lucide-react';
import { GroupInviteDialog } from './GroupInviteDialog';

interface GroupMember {
  id: string;
  role: string;
  user: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

interface PrivateGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  members: GroupMember[];
  _count: {
    members: number;
    posts: number;
  };
}

interface GroupCardProps {
  group: PrivateGroup;
  currentUserId?: string;
  isMember?: boolean;
  onInvite?: (groupId: string) => void;
  onView?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export function GroupCard({
  group,
  currentUserId,
  isMember = false,
  onInvite,
  onView,
  onLeave
}: GroupCardProps) {
  const { toast } = useToast();
  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleLeave = async () => {
    if (!onLeave) return;
    
    setIsLeaving(true);
    try {
      await onLeave(group.id);
      toast({
        title: "Left Group",
        description: `You have left ${group.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(group.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const userRole = group.members.find(m => m.user.id === currentUserId)?.role;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={handleView}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback>
              {getInitials(group.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-6 truncate">
                {group.name}
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                Private
              </Badge>
              {userRole && (
                <Badge variant="outline">
                  {userRole}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Created {formatDate(group.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {group.description && (
          <CardDescription className="mb-4 line-clamp-2">
            {group.description}
          </CardDescription>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group._count.members}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{group._count.posts}</span>
            </div>
          </div>
        </div>
        
        {currentUserId && isMember && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {userRole === 'admin' && onInvite && (
              <GroupInviteDialog 
                groupId={group.id}
                groupName={group.name}
                onInviteComplete={() => onInvite(group.id)}
              >
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              </GroupInviteDialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
              className="flex-1"
            >
              {isLeaving ? "Leaving..." : "Leave"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}