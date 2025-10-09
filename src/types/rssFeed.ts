/**
 * RSS Feed Types
 * Type definitions for RSS feed components and data structures
 */

export interface RssFeedCardProps {
  cardId: string;
  cardData?: any;
  onUpdate?: (updates: any) => void;
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  published?: string;
  summary?: string;
  thumbnail?: string;
  isShort?: boolean;
  embedUrl?: string;
  isSpotify?: boolean;
  trackNumber?: number;
}
