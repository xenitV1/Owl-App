/**
 * Media Handler Hook
 * Manages video/media card creation and connections
 */

import { useState } from "react";
import { CardConnection, VideoType } from "@/types/richNoteEditor";
import { getYouTubeVideoId, getSpotifyEmbedUrl } from "@/utils/mediaHelpers";

interface UseMediaHandlerProps {
  cardId: string;
  cards: any[];
  addCard: (card: any) => Promise<void>;
}

export const useMediaHandler = ({
  cardId,
  cards,
  addCard,
}: UseMediaHandlerProps) => {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("youtube");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [connections, setConnections] = useState<CardConnection[]>([]);

  /**
   * Creates a new media card (YouTube, Spotify, or video file)
   */
  const handleCreateVideoCard = async () => {
    try {
      // Validate input based on media type
      if (videoType !== "file" && !videoUrl.trim()) {
        alert("Lütfen geçerli bir medya URL girin");
        return;
      }

      if (videoType === "file" && !videoFile) {
        alert("Lütfen bir medya dosyası seçin");
        return;
      }

      // Get current card position for positioning the video card
      const currentCard = cards.find((c) => c.id === cardId);
      if (!currentCard) return;

      // Create media card with connection to current card
      const mediaCardId = `media-${Date.now()}`;
      const defaultTitle =
        videoType === "spotify"
          ? "Spotify"
          : videoType === "youtube"
            ? "YouTube Video"
            : videoType === "direct"
              ? "Video"
              : "Medya";

      const mediaCard = {
        id: mediaCardId,
        type: "platformContent" as const,
        title: videoTitle || defaultTitle,
        content: JSON.stringify({
          videoType,
          videoUrl: videoType !== "file" ? videoUrl : "",
          videoFile: videoType === "file" && videoFile ? videoFile.name : null,
          videoTitle: videoTitle || "",
          connectedTo: cardId, // Reference to the source card
        }),
        position: {
          x: currentCard.position.x + currentCard.size.width + 50, // Position to the right
          y: currentCard.position.y,
        },
        size: { width: 400, height: 352 }, // Spotify embed height
        zIndex: Math.max(...cards.map((c) => c.zIndex), 0) + 1,
      };

      // Add the media card
      await addCard(mediaCard);

      // Create connection between cards
      const newConnection: CardConnection = {
        id: `connection-${mediaCardId}`,
        sourceCardId: cardId,
        targetCardId: mediaCardId,
        sourcePosition: currentCard.position,
        targetPosition: mediaCard.position,
        sourceSize: currentCard.size,
        targetSize: mediaCard.size,
      };

      setConnections((prev) => [...prev, newConnection]);

      // Reset dialog state
      setVideoUrl("");
      setVideoTitle("");
      setVideoFile(null);
      setVideoType("youtube");
      setShowVideoDialog(false);

      console.log("🎵 Media Card Created Successfully:", mediaCard);
    } catch (error) {
      console.error("Error creating media card:", error);
      alert("Medya kartı oluşturulurken hata oluştu");
    }
  };

  return {
    showVideoDialog,
    setShowVideoDialog,
    videoUrl,
    setVideoUrl,
    videoTitle,
    setVideoTitle,
    videoType,
    setVideoType,
    videoFile,
    setVideoFile,
    connections,
    handleCreateVideoCard,
    getYouTubeVideoId,
    getSpotifyEmbedUrl,
  };
};
