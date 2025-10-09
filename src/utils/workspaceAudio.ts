/**
 * Workspace Audio Management Utilities
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useRef, useCallback, useEffect } from "react";

export interface AudioRefs {
  connectionAddSoundRef: React.MutableRefObject<HTMLAudioElement | null>;
  connectionRemoveSoundRef: React.MutableRefObject<HTMLAudioElement | null>;
}

export function useWorkspaceAudio() {
  // Connection audio refs
  const connectionAddSoundRef = useRef<HTMLAudioElement | null>(null);
  const connectionRemoveSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize connection audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      connectionAddSoundRef.current = new Audio(
        "/api/sounds/connection-add.mp3",
      );
      connectionAddSoundRef.current.volume = 0.4;
      connectionAddSoundRef.current.preload = "auto";

      connectionRemoveSoundRef.current = new Audio(
        "/api/sounds/connection-remove.mp3",
      );
      connectionRemoveSoundRef.current.volume = 0.4;
      connectionRemoveSoundRef.current.preload = "auto";

      // Preload
      connectionAddSoundRef.current.load();
      connectionRemoveSoundRef.current.load();
    }
  }, []);

  // Play connection add sound
  const playConnectionAddSound = useCallback(() => {
    if (connectionAddSoundRef.current) {
      connectionAddSoundRef.current.currentTime = 0;
      connectionAddSoundRef.current.play().catch((err) => {
        console.warn("[Workspace] Failed to play connection add sound:", err);
      });
    }
  }, []);

  // Play connection remove sound
  const playConnectionRemoveSound = useCallback(() => {
    if (connectionRemoveSoundRef.current) {
      connectionRemoveSoundRef.current.currentTime = 0;
      connectionRemoveSoundRef.current.play().catch((err) => {
        console.warn(
          "[Workspace] Failed to play connection remove sound:",
          err,
        );
      });
    }
  }, []);

  return {
    connectionAddSoundRef,
    connectionRemoveSoundRef,
    playConnectionAddSound,
    playConnectionRemoveSound,
  };
}
