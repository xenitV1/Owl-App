import { useRef } from "react";

export function useWorkspaceCardLock() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (srcList: string[]) => {
    try {
      const audio = audioRef.current || new Audio();
      audioRef.current = audio;
      // Try provided sources, fallback to notification.mp3 in public
      const src = srcList.find(Boolean) || "/notification.mp3";
      audio.src = src;
      audio.volume = 0.35;
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {}
  };

  // Synchronized audio-visual feedback for lock/unlock
  const playSyncedLockFeedback = (
    isCurrentlyLocked: boolean,
    element: HTMLElement,
  ) => {
    const lockSound = "/api/sounds/lock.mp3";
    const unlockSound = "/api/sounds/unlock.mp3";

    try {
      // Create audio element
      const audio = new Audio();
      const soundFile = isCurrentlyLocked ? unlockSound : lockSound;
      audio.src = soundFile;
      audio.volume = 0.4;
      audio.currentTime = 0;

      // Clean up any existing animations
      element.classList.remove(
        "ring-2",
        "ring-4",
        "ring-green-500",
        "ring-blue-500",
        "ring-orange-500",
        "ring-red-500",
        "ring-offset-2",
        "ring-offset-4",
      );
      element.style.animation = "";
      void element.offsetWidth; // force reflow

      // Start audio and animation simultaneously
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started successfully - trigger animation
            if (isCurrentlyLocked) {
              // Unlocking - warm orange glow
              element.classList.add(
                "ring-4",
                "ring-orange-500",
                "ring-offset-2",
              );
              element.style.animation = "unlock-pulse 0.6s ease-out";
            } else {
              // Locking - cool green glow
              element.classList.add(
                "ring-4",
                "ring-green-500",
                "ring-offset-2",
              );
              element.style.animation = "lock-pulse 0.6s ease-out";
            }

            // Clean up after animation (600ms to match audio duration)
            setTimeout(() => {
              element.classList.remove(
                "ring-4",
                "ring-green-500",
                "ring-blue-500",
                "ring-orange-500",
                "ring-red-500",
                "ring-offset-2",
              );
              element.style.animation = "";
            }, 600);
          })
          .catch(() => {
            // Audio blocked - still show visual feedback
            if (isCurrentlyLocked) {
              element.classList.add(
                "ring-4",
                "ring-orange-500",
                "ring-offset-2",
              );
              element.style.animation = "unlock-pulse 0.6s ease-out";
            } else {
              element.classList.add(
                "ring-4",
                "ring-green-500",
                "ring-offset-2",
              );
              element.style.animation = "lock-pulse 0.6s ease-out";
            }

            setTimeout(() => {
              element.classList.remove(
                "ring-4",
                "ring-green-500",
                "ring-orange-500",
                "ring-offset-2",
              );
              element.style.animation = "";
            }, 600);
          });
      }
    } catch (error) {
      console.error("Lock feedback error:", error);
    }
  };

  return {
    playSound,
    playSyncedLockFeedback,
    audioRef,
  };
}
