import { useCallback, useState } from "react";

export function useTransform() {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.25, 0.5)),
    [],
  );
  const rotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const rotateBy = useCallback(
    (delta: number) => setRotation((r) => (r + delta) % 360),
    [],
  );

  return {
    // state
    zoom,
    rotation,
    panX,
    panY,
    isDragging,
    dragStart,
    lastPan,
    // setters
    setZoom,
    setRotation,
    setPanX,
    setPanY,
    setIsDragging,
    setDragStart,
    setLastPan,
    // actions
    resetTransform,
    zoomIn,
    zoomOut,
    rotate,
    rotateBy,
  };
}
