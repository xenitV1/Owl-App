'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  ExternalLink,
  Clock,
  Globe,
  Plus,
  RefreshCw,
  Filter,
  Bookmark,
  Share2
} from 'lucide-react';
import { useLoadingMessages } from '@/hooks/useLoadingMessages';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  domain: string;
  thumbnail?: string;
  favicon?: string;
  timestamp: string;
  searchQuery: string;
}

interface OwlSearchCardProps {
  cardId: string;
  initialQuery?: string;
}

export function OwlSearchCard({ cardId, initialQuery = '' }: OwlSearchCardProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { addCard, cards } = useWorkspaceStore() as any;

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: ['loadingSearch', 'analyzing', 'processing', 'preparing', 'optimizing'],
    interval: 1200
  });

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`owl-search-history-${cardId}`);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, [cardId]);

  // Save search history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`owl-search-history-${cardId}`, JSON.stringify(searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [searchHistory, cardId]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 10);
        return newHistory;
      });

      const response = await fetch(`/api/owl-search?q=${encodeURIComponent(query)}&num=8`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  }, [searchQuery, performSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Create web card instead of opening in new tab
    handleAddAsWebCard(result);
  }, []);

  const handleAddAsWebCard = useCallback(async (result: SearchResult) => {
    try {
      // Get current card data for better positioning
      const currentCard = cards?.find((c: any) => c.id === cardId);
      
      let baseX = 100;
      let baseY = 100;
      let baseW = 400;
      
      if (currentCard) {
        baseX = currentCard.position?.x ?? 100;
        baseY = currentCard.position?.y ?? 100;
        baseW = currentCard.size?.width ?? 400;
      }

      // Position new card to the right of the search card
      const offset = 50;
      const newCard = {
        id: `web-card-${Date.now()}`,
        type: 'platformContent' as const,
        title: result.title,
        content: JSON.stringify({ 
          webUrl: result.url, 
          webTitle: result.title,
          connectedTo: { sourceCardId: cardId }
        }),
        position: {
          x: baseX + baseW + offset,
          y: baseY,
        },
        size: { width: 800, height: 600 },
        zIndex: Math.max(...(cards?.map((c: any) => c.zIndex) || [0])) + 1,
      };

      addCard(newCard);
    } catch (error) {
      console.error('Failed to add web card:', error);
    }
  }, [addCard, cardId, cards]);

  const formatDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const searchTime = new Date(timestamp);
    const diffMs = now.getTime() - searchTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">🦉</span>
            Owl Search
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Search Engine
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the web with Owl Search..."
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !searchQuery.trim()}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Search History */}
        {searchHistory.length > 0 && !loading && searchResults.length === 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Searches</h4>
            <div className="flex flex-wrap gap-1">
              {searchHistory.slice(0, 5).map((query, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(query);
                    performSearch(query);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {currentMessage || 'Searching...'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-sm text-destructive mb-2">Search Error</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  if (searchQuery.trim()) {
                    performSearch(searchQuery.trim());
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && searchResults.length > 0 && (
          <div className="flex-1 overflow-auto space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground">
                {searchResults.length} results for "{searchQuery}"
              </h4>
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Web Search
              </Badge>
            </div>

            {searchResults.map((result) => (
              <Card key={result.id} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex gap-3">
                  {/* Favicon */}
                  <div className="flex-shrink-0">
                    {result.favicon ? (
                      <img
                        src={result.favicon}
                        alt={result.domain}
                        className="w-4 h-4 rounded-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-4 h-4 bg-muted rounded-sm flex items-center justify-center">
                        <Globe className="h-2 w-2 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 
                        className="text-sm font-medium text-primary hover:underline cursor-pointer line-clamp-2"
                        onClick={() => handleResultClick(result)}
                        title={result.title}
                      >
                        {result.title}
                      </h5>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResultClick(result)}
                          className="h-6 w-6 p-0"
                          title="Open as new card"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
                          className="h-6 w-6 p-0"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {result.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{formatDomain(result.url)}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(result.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && searchResults.length === 0 && searchHistory.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Start searching the web
              </p>
              <p className="text-xs text-muted-foreground">
                Enter a query above to search with Owl Search
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}
