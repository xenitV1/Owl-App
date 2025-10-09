/**
 * Service for creating Spotify-related cards in the workspace
 * Handles track, playlist, album, and artist card creation
 */

export interface CardData {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album?: {
    images?: Array<{ url: string }>;
  };
  artists?: Array<{ name: string }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  artists?: Array<{ name: string }>;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}

/**
 * Spotify Card Service
 * Handles creation of various Spotify content cards in the workspace
 */
export class SpotifyCardService {
  /**
   * Create a track card in the workspace
   */
  static createTrackCard(
    track: SpotifyTrack,
    cardData?: CardData,
    cardId?: string,
  ): void {
    try {
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: "platformContent" as const,
        title: track.name || "Spotify Track",
        content: JSON.stringify({
          videoType: "spotify",
          videoUrl: `https://open.spotify.com/track/${track.id}`,
          videoTitle: track.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      const ev = new CustomEvent("workspace:addCard", { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn("[SpotifyCardService] Failed to create track card", e);
    }
  }

  /**
   * Create a playlist card in the workspace
   */
  static createPlaylistCard(
    playlist: SpotifyPlaylist,
    cardData?: CardData,
    cardId?: string,
  ): void {
    try {
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: "platformContent" as const,
        title: playlist.name || "Spotify Playlist",
        content: JSON.stringify({
          videoType: "spotify",
          videoUrl: `https://open.spotify.com/playlist/${playlist.id}`,
          videoTitle: playlist.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      const ev = new CustomEvent("workspace:addCard", { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn("[SpotifyCardService] Failed to create playlist card", e);
    }
  }

  /**
   * Create an album card in the workspace
   */
  static createAlbumCard(
    album: SpotifyAlbum,
    cardData?: CardData,
    cardId?: string,
  ): void {
    try {
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: "platformContent" as const,
        title: album.name || "Spotify Album",
        content: JSON.stringify({
          videoType: "spotify",
          videoUrl: `https://open.spotify.com/album/${album.id}`,
          videoTitle: album.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      const ev = new CustomEvent("workspace:addCard", { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn("[SpotifyCardService] Failed to create album card", e);
    }
  }

  /**
   * Create an artist card in the workspace
   */
  static createArtistCard(
    artist: SpotifyArtist,
    cardData?: CardData,
    cardId?: string,
  ): void {
    try {
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: "platformContent" as const,
        title: artist.name || "Spotify Artist",
        content: JSON.stringify({
          videoType: "spotify",
          videoUrl: `https://open.spotify.com/artist/${artist.id}`,
          videoTitle: artist.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      const ev = new CustomEvent("workspace:addCard", { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn("[SpotifyCardService] Failed to create artist card", e);
    }
  }

  /**
   * Handle track click - create track card
   */
  static handleTrackClick(
    trackId: string,
    trackName: string,
    track?: SpotifyTrack,
    cardData?: CardData,
    cardId?: string,
  ): void {
    console.log("[SpotifyCardService] Creating card for:", {
      trackId,
      trackName,
      hasTrack: !!track,
    });

    try {
      if (track) {
        this.createTrackCard(track, cardData, cardId);
      }
    } catch (e: any) {
      console.error("[SpotifyCardService] Error creating track card:", e);
    }
  }

  /**
   * Handle search result click - create appropriate card type
   */
  static handleSearchResultClick(
    item: any,
    cardData?: CardData,
    cardId?: string,
  ): void {
    try {
      if (item.type === "track" && item.fullData) {
        this.createTrackCard(item.fullData, cardData, cardId);
      } else if (item.type === "playlist") {
        this.createPlaylistCard(item, cardData, cardId);
      } else if (item.type === "album") {
        this.createAlbumCard(item, cardData, cardId);
      } else if (item.type === "artist") {
        this.createArtistCard(item, cardData, cardId);
      }
    } catch (e: any) {
      console.error(
        "[SpotifyCardService] Error handling search result click:",
        e,
      );
    }
  }

  /**
   * Create embed URL for Spotify content
   */
  static toEmbed(type: string, id: string): string {
    return `https://open.spotify.com/${type}/${id}`;
  }
}
