"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityCard } from "@/components/communities/CommunityCard";
import { GroupCard } from "@/components/communities/GroupCard";
import {
  LazyCommunityCreateDialog,
  LazyGroupCreateDialog,
  LazyCommunityFeed,
  LazyGroupFeed,
} from "@/components/lazy";
import { prefetchComponents } from "@/components/lazy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "next-intl";
import { getCountryFlagUrl } from "@/lib/utils";
import {
  Search,
  Users,
  Plus,
  BookOpen,
  Hash,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  country?: string | null;
  grade?: string | null;
  isSystemGenerated?: boolean;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name?: string;
      avatar?: string;
    };
  }>;
  _count: {
    members: number;
    posts: number;
  };
}

interface PrivateGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name?: string;
      avatar?: string;
    };
  }>;
  _count: {
    members: number;
    posts: number;
  };
}

export default function CommunitiesPage() {
  const { user, dbUser, isGuest } = useAuth();
  const locale = useLocale();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [myGroups, setMyGroups] = useState<PrivateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [viewingCommunity, setViewingCommunity] = useState<string | null>(null);
  const [viewingGroup, setViewingGroup] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities?limit=50");
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchMyCommunities = async () => {
    if (isGuest || !user) return;

    try {
      const response = await fetch(
        `/api/communities?userId=${dbUser?.id}&joined=true&limit=50`,
      );
      if (response.ok) {
        const data = await response.json();
        setMyCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching my communities:", error);
    }
  };

  const fetchMyGroups = async () => {
    if (isGuest || !user) return;

    try {
      const response = await fetch(`/api/groups?userId=${dbUser?.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setMyGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching my groups:", error);
    }
  };

  const handleSearchCommunities = async () => {
    if (!searchQuery.trim()) {
      await fetchCommunities();
      return;
    }

    try {
      const response = await fetch(
        `/api/communities?search=${encodeURIComponent(searchQuery)}&limit=50`,
      );
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error searching communities:", error);
      toast({
        title: "Search Error",
        description: "Failed to search communities",
        variant: "destructive",
      });
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (isGuest) return;

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh communities and my communities
        await Promise.all([fetchCommunities(), fetchMyCommunities()]);
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error("Error joining community:", error);
      throw error;
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (isGuest) return;

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh communities and my communities
        await Promise.all([fetchCommunities(), fetchMyCommunities()]);
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      throw error;
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (isGuest) return;

    try {
      const response = await fetch(
        `/api/groups/${groupId}/invite?userId=${dbUser?.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Refresh groups
        await fetchMyGroups();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  };

  const handleCreateCommunity = (newCommunity: Community) => {
    setMyCommunities((prev) => [newCommunity, ...prev]);
    setActiveTab("my-communities");
  };

  const handleCreateGroup = (newGroup: PrivateGroup) => {
    setMyGroups((prev) => [newGroup, ...prev]);
    setActiveTab("my-groups");
  };

  const handleInviteToGroup = async (groupId: string) => {
    // Refresh groups to show updated member count
    await fetchMyGroups();
  };

  const handleViewCommunity = (communityId: string) => {
    setViewingCommunity(communityId);
  };

  const handleViewGroup = (groupId: string) => {
    setViewingGroup(groupId);
  };

  const handleBackToList = () => {
    setViewingCommunity(null);
    setViewingGroup(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCommunities(),
        fetchMyCommunities(),
        fetchMyGroups(),
      ]);

      // Prefetch community components after initial load
      if (!isGuest && user) {
        prefetchComponents.prefetchCommunityComponents();
      }

      setIsLoading(false);
    };

    loadData();
  }, [isGuest, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "discover") {
        handleSearchCommunities();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  // Auto-refresh communities every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || isGuest) return;

    const refreshInterval = setInterval(async () => {
      // Silent refresh
      await Promise.all([
        fetchCommunities(),
        fetchMyCommunities(),
        fetchMyGroups(),
      ]);
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, isGuest, user]);

  const isMemberOfCommunity = (communityId: string) => {
    return myCommunities.some((c) => c.id === communityId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Show Community Feed if viewing a specific community */}
      {viewingCommunity && (
        <LazyCommunityFeed
          communityId={viewingCommunity}
          currentUserId={dbUser?.id}
          onBack={handleBackToList}
        />
      )}

      {/* Show Group Feed if viewing a specific group */}
      {viewingGroup && (
        <LazyGroupFeed
          groupId={viewingGroup}
          currentUserId={dbUser?.id}
          onBack={handleBackToList}
        />
      )}

      {/* Show main communities/groups list if not viewing specific community or group */}
      {!viewingCommunity && !viewingGroup && (
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Communities & Groups
                </h1>
                <p className="text-muted-foreground text-lg">
                  Join communities to collaborate with other students or create
                  private groups for close friends
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  title={
                    autoRefreshEnabled
                      ? "Auto-refresh enabled (10s)"
                      : "Auto-refresh disabled"
                  }
                >
                  <RefreshCw
                    className={`h-4 w-4 ${autoRefreshEnabled ? "animate-spin-slow" : ""}`}
                  />
                </Button>
                {!isGuest && (
                  <>
                    <LazyCommunityCreateDialog
                      onCreateCommunity={handleCreateCommunity}
                    />
                    <LazyGroupCreateDialog onCreateGroup={handleCreateGroup} />
                  </>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Feed */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="discover"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Discover
                  </TabsTrigger>
                  {!isGuest && (
                    <>
                      <TabsTrigger
                        value="my-communities"
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        My Communities
                      </TabsTrigger>
                      <TabsTrigger
                        value="my-groups"
                        className="flex items-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        My Groups
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="discover" className="mt-6">
                  {communities.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Hash className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          No communities found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {searchQuery
                            ? "Try a different search term"
                            : "Be the first to create a community!"}
                        </p>
                        {!isGuest && !searchQuery && (
                          <LazyCommunityCreateDialog
                            onCreateCommunity={handleCreateCommunity}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {communities.map((community) => (
                        <CommunityCard
                          key={community.id}
                          community={community}
                          currentUserId={dbUser?.id}
                          isMember={isMemberOfCommunity(community.id)}
                          onJoin={handleJoinCommunity}
                          onLeave={handleLeaveCommunity}
                          onView={handleViewCommunity}
                          locale={locale}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {!isGuest && (
                  <>
                    <TabsContent value="my-communities" className="mt-6">
                      {myCommunities.length === 0 ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">
                              No communities yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Join communities to connect with other students
                            </p>
                            <LazyCommunityCreateDialog
                              onCreateCommunity={handleCreateCommunity}
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {myCommunities.map((community) => (
                            <CommunityCard
                              key={community.id}
                              community={community}
                              currentUserId={dbUser?.id}
                              isMember={true}
                              onLeave={handleLeaveCommunity}
                              onView={handleViewCommunity}
                              locale={locale}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="my-groups" className="mt-6">
                      {myGroups.length === 0 ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">
                              No groups yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Create private groups for close friends
                            </p>
                            <LazyGroupCreateDialog
                              onCreateGroup={handleCreateGroup}
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {myGroups.map((group) => (
                            <GroupCard
                              key={group.id}
                              group={group}
                              currentUserId={dbUser?.id}
                              isMember={true}
                              onLeave={handleLeaveGroup}
                              onInvite={handleInviteToGroup}
                              onView={handleViewGroup}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Communities
                      </span>
                      <Badge variant="secondary">{communities.length}</Badge>
                    </div>
                    {!isGuest && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            My Communities
                          </span>
                          <Badge variant="secondary">
                            {myCommunities.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            My Groups
                          </span>
                          <Badge variant="secondary">{myGroups.length}</Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Communities */}
              {communities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Featured Communities
                    </CardTitle>
                    <CardDescription>
                      Popular learning communities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {communities
                        .sort((a, b) => b._count.members - a._count.members)
                        .slice(0, 3)
                        .map((community) => (
                          <div
                            key={community.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          >
                            <img
                              src={
                                getCountryFlagUrl(community.country) ||
                                community.avatar ||
                                ""
                              }
                              alt={community.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {community.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {community._count.members} members
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
