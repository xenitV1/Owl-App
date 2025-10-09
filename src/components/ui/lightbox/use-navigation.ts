import { useCallback, useEffect } from "react";

export function useIndexNavigation(
  length: number,
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
  onClose: () => void,
  onZoomIn: () => void,
  onZoomOut: () => void,
  onRotate: () => void,
  onRotateBy: (d: number) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (e.shiftKey) onRotateBy(-15);
          else onPrev();
          break;
        case "ArrowRight":
          if (e.shiftKey) onRotateBy(15);
          else onNext();
          break;
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          onZoomIn();
          break;
        case "-":
          onZoomOut();
          break;
        case "r":
          if (e.shiftKey) onRotateBy(-15);
          else onRotate();
          break;
        case "R":
          onRotateBy(15);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onPrev,
    onNext,
    onClose,
    onZoomIn,
    onZoomOut,
    onRotate,
    onRotateBy,
  ]);

  const getPrevIndex = useCallback(
    (current: number) => (current > 0 ? current - 1 : length - 1),
    [length],
  );
  const getNextIndex = useCallback(
    (current: number) => (current < length - 1 ? current + 1 : 0),
    [length],
  );

  return { getPrevIndex, getNextIndex };
}
