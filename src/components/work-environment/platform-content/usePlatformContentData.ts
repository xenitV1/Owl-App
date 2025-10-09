"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ContentType =
  | "posts"
  | "communities"
  | "users"
  | "trending"
  | "following"
  | "discover";

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PlatformFilters {
  subject?: string;
  communityId?: string;
  userId?: string;
  search?: string;
}

export interface ApiResponse<TData> {
  type: ContentType;
  data: TData | any;
  pagination: PaginationState;
}

export interface UsePlatformContentDataOptions {
  initialType?: ContentType;
  initialFilters?: PlatformFilters;
  initialAutoRefresh?: boolean;
  initialRefreshInterval?: number; // minutes
}

export function usePlatformContentData<TItem = any>({
  initialType = "posts",
  initialFilters = {},
  initialAutoRefresh = false,
  initialRefreshInterval = 5,
}: UsePlatformContentDataOptions) {
  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [data, setData] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlatformFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(initialAutoRefresh);
  const [refreshInterval, setRefreshInterval] = useState<number>(
    initialRefreshInterval,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (page = 1) => {
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

        if (filters.search) params.append("search", filters.search);
        if (filters.subject) params.append("subject", filters.subject);
        if (filters.communityId)
          params.append("communityId", filters.communityId);
        if (filters.userId) params.append("userId", filters.userId);

        const response = await fetch(`/api/platform-content?${params}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch data");

        const result: ApiResponse<any> = await response.json();

        let dataArray: any[] = [];
        if (Array.isArray(result.data)) {
          dataArray = result.data;
        } else if (result.data && typeof result.data === "object") {
          if (result.type === "discover" && result.data.recentPosts) {
            dataArray = result.data.recentPosts;
          }
        }
        setData(dataArray);
        setPagination(result.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [contentType, pagination.limit, filters],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(
      () => {
        fetchData(pagination.page);
      },
      refreshInterval * 60 * 1000,
    );

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, pagination.page, fetchData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (refreshIntervalRef.current)
        clearInterval(refreshIntervalRef.current as any);
    };
  }, []);

  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof PlatformFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    state: {
      contentType,
      data,
      loading,
      error,
      filters,
      pagination,
      autoRefresh,
      refreshInterval,
    },
    actions: {
      fetchData,
      setPagination,
      setAutoRefresh,
      setRefreshInterval,
      handleContentTypeChange,
      handleFilterChange,
    },
  } as const;
}
