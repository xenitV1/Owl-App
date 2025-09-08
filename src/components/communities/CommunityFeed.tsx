'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/content/PostCard';
import { PostCreationForm } from '@/components/content/PostCreationForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MasonryGrid } from '@/components/ui/masonry-grid';
import { ArrowLeft, Users, BookOpen, Hash, Plus } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  subject?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    school?: string;
    grade?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

interface CommunityMember {
  id: string;
  role: string;
  user: {
    id: string;
    name?: string;
    avatar?: string;
    school?: string;
    grade?: string;
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
}

interface CommunityFeedProps {
  communityId: string;
  currentUserId?: string;
  onBack?: () => void;
}

export function CommunityFeed({ communityId, currentUserId, onBack }: CommunityFeedProps) {
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/posts?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching community posts:', error);
    }
  };

  const handleCreatePost = async (postData: any) => {
    if (!currentUserId) return;

    setIsPosting(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts(prev => [newPost, ...prev]);
        setShowCreateForm(false);
        
        // Update community post count
        if (community) {
          setCommunity(prev => prev ? {
            ...prev,
            _count: {
              ...prev._count,
              posts: prev._count.posts + 1
            }
          } : null);
        }
        
        toast({
          title: "Success",
          description: "Post created successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCommunity();
        toast({
          title: "Success",
          description: `You have joined ${community?.name}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to join community",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    }
  };

  const handleLeaveCommunity = async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCommunity();
        toast({
          title: "Success",
          description: `You have left ${community?.name}`,
        });
        if (onBack) {
          onBack();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to leave community",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCommunity(),
        fetchCommunityPosts()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [communityId]);

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

  const isMember = community?.members.some(m => m.user.id === currentUserId);
  const userRole = community?.members.find(m => m.user.id === currentUserId)?.role;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
          
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Community not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold">
              {getInitials(community.name)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{community.name}</h1>
                <Badge variant={community.isPublic ? "default" : "secondary"}>
                  {community.isPublic ? "Public" : "Private"}
                </Badge>
                {isMember && userRole && (
                  <Badge variant="outline">{userRole}</Badge>
                )}
              </div>
              
              {community.description && (
                <p className="text-muted-foreground mb-4">{community.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{community._count.members} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{community._count.posts} posts</span>
                </div>
                <span>Created {formatDate(community.createdAt)}</span>
              </div>
              
              {currentUserId && (
                <div className="mt-4">
                  {isMember ? (
                    <div className="flex gap-2">
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Post
                      </Button>
                      <Button variant="outline" onClick={handleLeaveCommunity}>
                        Leave Community
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleJoinCommunity}>
                      Join Community
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Post Form */}
        {showCreateForm && isMember && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create a Post</CardTitle>
            </CardHeader>
            <CardContent>
              <PostCreationForm
                onSubmit={handleCreatePost}
                isSubmitting={isPosting}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Hash className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isMember 
                    ? "Be the first to share something with the community!"
                    : "Join this community to see and create posts."
                  }
                </p>
                {isMember && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <MasonryGrid
              items={posts}
              columns={[1, 2, 2]}
              gap={[16, 20, 24]}
              media={[640, 768, 1024]}
              useBalancedLayout={true}
              renderItem={(post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}