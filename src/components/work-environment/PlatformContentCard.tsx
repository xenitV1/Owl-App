'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings, 
  RefreshCw, 
  ChevronDown, 
  Users, 
  Hash, 
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Bookmark,
  ExternalLink,
  Filter
} from 'lucide-react';

interface PlatformContentCardProps {
  cardId: string;
  config?: {
    contentType: 'posts' | 'communities' | 'users' | 'trending' | 'following' | 'discover';
    filters?: {
      subject?: string;
      communityId?: string;
      userId?: string;
      search?: string;
    };
    refreshInterval?: number; // in minutes
    autoRefresh?: boolean;
  };
}

interface Post {
  id: string;
  title: string;
  content?: string;
  subject?: string;
  image?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    school?: string;
    grade?: string;
  };
  community?: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  _count: {
    members: number;
    posts: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface ApiResponse {
  type: string;
  data: Post[] | Community[] | User[] | any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function PlatformContentCard({ cardId, config }: PlatformContentCardProps) {
  const [contentType, setContentType] = useState(config?.contentType || 'posts');
  const [data, setData] = useState<Post[] | Community[] | User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(config?.filters || {});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(config?.autoRefresh || false);
  const [refreshInterval, setRefreshInterval] = useState(config?.refreshInterval || 5);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: contentType,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Only add filters if they have values
      if (filters.search) params.append('search', filters.search);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.communityId) params.append('communityId', filters.communityId);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(`/api/platform-content?${params}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result: ApiResponse = await response.json();
      
      // Handle different data structures
      let dataArray: any[] = [];
      if (Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (result.data && typeof result.data === 'object') {
        // For discover type, we might have nested data
        if (result.type === 'discover' && result.data.recentPosts) {
          dataArray = result.data.recentPosts;
        } else {
          dataArray = [];
        }
      }
      
      setData(dataArray);
      setPagination(result.pagination);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [contentType, pagination.limit, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh with proper cleanup
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchData(pagination.page);
    }, refreshInterval * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, pagination.page, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleContentTypeChange = (newType: string) => {
    setContentType(newType as any);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{post.author.name}</span>
              {post.author.role !== 'STUDENT' && (
                <Badge variant="secondary" className="text-xs">
                  {post.author.role}
                </Badge>
              )}
              {post.community && (
                <Badge variant="outline" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {post.community.name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
            {post.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {post.content}
              </p>
            )}
            {post.subject && (
              <Badge variant="outline" className="text-xs mb-2">
                {post.subject}
              </Badge>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post._count.comments}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                {post._count.pools}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCommunity = (community: Community) => (
    <Card key={community.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={community.avatar} />
            <AvatarFallback>
              <Hash className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{community.name}</h3>
            {community.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {community.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {community._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {community._count.posts} posts
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(community.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUser = (user: User) => (
    <Card key={user.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{user.name}</span>
              {user.role !== 'STUDENT' && (
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              )}
              {user.isVerified && (
                <Badge variant="default" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            {user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              {user.school && <span>{user.school}</span>}
              {user.grade && <span>{user.grade}</span>}
              {user.favoriteSubject && (
                <Badge variant="outline" className="text-xs">
                  {user.favoriteSubject}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{user._count.posts} posts</span>
              <span>{user._count.followers} followers</span>
              <span>{user._count.following} following</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(pagination.page)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-2">No content found</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(pagination.page)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((item: any) => {
          if (contentType === 'posts') return renderPost(item);
          if (contentType === 'communities') return renderCommunity(item);
          if (contentType === 'users') return renderUser(item);
          return null;
        })}
        
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchData(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchData(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Platform Content</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fetchData(pagination.page)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={contentType} onValueChange={handleContentTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="posts">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Posts
                </div>
              </SelectItem>
              <SelectItem value="communities">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Communities
                </div>
              </SelectItem>
              <SelectItem value="users">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </div>
              </SelectItem>
              <SelectItem value="following">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </div>
              </SelectItem>
              <SelectItem value="discover">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Discover
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showSettings && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Search:</label>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-2 py-1 text-xs border rounded"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            {contentType === 'posts' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Subject:</label>
                <input
                  type="text"
                  placeholder="Subject filter..."
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Auto Refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="text-xs"
              />
            </div>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Interval (min):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border rounded"
                />
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {renderContent()}
      </CardContent>
    </div>
  );
}
