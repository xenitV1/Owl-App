"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export type LoadingMessageKey =
  | 'connecting'
  | 'fetching'
  | 'processing'
  | 'analyzing'
  | 'preparing'
  | 'optimizing'
  | 'saving'
  | 'syncing'
  | 'generating'
  | 'validating'
  | 'filtering'
  | 'caching'
  | 'parsing'
  | 'rendering'
  | 'initializing'
  | 'authenticating'
  | 'uploading'
  | 'downloading'
  | 'converting'
  | 'compressing'
  | 'extracting'
  | 'scanning'
  | 'indexing'
  | 'updating'
  | 'refreshing'
  | 'loadingContent'
  | 'loadingData'
  | 'loadingImages'
  | 'loadingFeed'
  | 'loadingProfile'
  | 'loadingSettings'
  | 'loadingComments'
  | 'loadingNotifications'
  | 'loadingSearch'
  | 'loadingRecommendations'
  | 'preparingWorkspace'
  | 'preparingContent'
  | 'preparingLayout'
  | 'preparingInterface'
  | 'configuring'
  | 'establishingConnection'
  | 'retrievingInformation'
  | 'processingRequest'
  | 'verifyingContent'
  | 'applyingFilters'
  | 'organizingData'
  | 'finalizing';

interface UseLoadingMessagesOptions {
  isLoading: boolean;
  messageKeys?: LoadingMessageKey[];
  interval?: number;
}

export function useLoadingMessages({
  isLoading,
  messageKeys = ['processing', 'analyzing', 'preparing', 'optimizing'],
  interval = 2000
}: UseLoadingMessagesOptions) {
  const t = useTranslations('loading');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messageKeys.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, messageKeys.length, interval]);

  const currentMessage = isLoading ? t(messageKeys[currentMessageIndex]) : '';

  return {
    currentMessage,
    currentMessageKey: messageKeys[currentMessageIndex],
    messageIndex: currentMessageIndex,
    totalMessages: messageKeys.length
  };
}
