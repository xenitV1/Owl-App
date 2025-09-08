import { useState, useEffect, useCallback } from 'react';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface Layouts {
  [key: string]: LayoutItem[];
}

const STORAGE_KEY = 'owl-discover-layout';

// Default layout configuration for discover page
const getDefaultLayouts = (): Layouts => ({
  lg: [
    { i: 'header', x: 0, y: 0, w: 12, h: 2, minH: 2, maxH: 4 },
    { i: 'search', x: 0, y: 2, w: 12, h: 1, minH: 1, maxH: 2 },
    { i: 'tabs', x: 0, y: 3, w: 9, h: 12 },
    { i: 'recommended-users', x: 9, y: 3, w: 3, h: 4, minH: 3, minW: 2 },
    { i: 'popular-subjects', x: 9, y: 7, w: 3, h: 3, minH: 2, minW: 2 },
    { i: 'platform-stats', x: 9, y: 10, w: 3, h: 3, minH: 2, minW: 2 },
  ],
  md: [
    { i: 'header', x: 0, y: 0, w: 10, h: 2, minH: 2, maxH: 4 },
    { i: 'search', x: 0, y: 2, w: 10, h: 1, minH: 1, maxH: 2 },
    { i: 'tabs', x: 0, y: 3, w: 7, h: 12 },
    { i: 'recommended-users', x: 7, y: 3, w: 3, h: 4, minH: 3, minW: 2 },
    { i: 'popular-subjects', x: 7, y: 7, w: 3, h: 3, minH: 2, minW: 2 },
    { i: 'platform-stats', x: 7, y: 10, w: 3, h: 3, minH: 2, minW: 2 },
  ],
  sm: [
    { i: 'header', x: 0, y: 0, w: 6, h: 2, minH: 2, maxH: 4 },
    { i: 'search', x: 0, y: 2, w: 6, h: 1, minH: 1, maxH: 2 },
    { i: 'tabs', x: 0, y: 3, w: 6, h: 12 },
    { i: 'recommended-users', x: 0, y: 15, w: 6, h: 4, minH: 3 },
    { i: 'popular-subjects', x: 0, y: 19, w: 6, h: 3, minH: 2 },
    { i: 'platform-stats', x: 0, y: 22, w: 6, h: 3, minH: 2 },
  ],
  xs: [
    { i: 'header', x: 0, y: 0, w: 4, h: 2, minH: 2, maxH: 4 },
    { i: 'search', x: 0, y: 2, w: 4, h: 1, minH: 1, maxH: 2 },
    { i: 'tabs', x: 0, y: 3, w: 4, h: 12 },
    { i: 'recommended-users', x: 0, y: 15, w: 4, h: 4, minH: 3 },
    { i: 'popular-subjects', x: 0, y: 19, w: 4, h: 3, minH: 2 },
    { i: 'platform-stats', x: 0, y: 22, w: 4, h: 3, minH: 2 },
  ],
  xxs: [
    { i: 'header', x: 0, y: 0, w: 2, h: 3, minH: 2, maxH: 5 },
    { i: 'search', x: 0, y: 3, w: 2, h: 1, minH: 1, maxH: 2 },
    { i: 'tabs', x: 0, y: 4, w: 2, h: 15 },
    { i: 'recommended-users', x: 0, y: 19, w: 2, h: 5, minH: 4 },
    { i: 'popular-subjects', x: 0, y: 24, w: 2, h: 4, minH: 3 },
    { i: 'platform-stats', x: 0, y: 28, w: 2, h: 4, minH: 3 },
  ],
});

export const useDraggableLayout = () => {
  const [layouts, setLayouts] = useState<Layouts>(getDefaultLayouts);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load layouts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedLayouts = JSON.parse(saved);
        setLayouts(parsedLayouts);
      }
    } catch (error) {
      console.error('Error loading layout from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save layouts to localStorage
  const saveLayout = useCallback((newLayouts: Layouts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
      setLayouts(newLayouts);
    } catch (error) {
      console.error('Error saving layout to localStorage:', error);
    }
  }, []);

  // Handle layout change
  const onLayoutChange = useCallback((currentLayout: LayoutItem[], allLayouts: Layouts) => {
    saveLayout(allLayouts);
  }, [saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    console.log('Reset layout function called');
    try {
      // Clear localStorage first
      localStorage.removeItem(STORAGE_KEY);
      console.log('LocalStorage cleared');
      
      // Get fresh default layouts
      const defaultLayouts = getDefaultLayouts();
      console.log('Default layouts generated:', defaultLayouts);
      
      // Force update state immediately
      setLayouts(defaultLayouts);
      
      // Also save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayouts));
      
      console.log('Layout reset completed - tabs container now has no size constraints');
      
      // Force a page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error resetting layout:', error);
    }
  }, []);

  // Breakpoints configuration
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  return {
    layouts,
    onLayoutChange,
    resetLayout,
    breakpoints,
    cols,
    isLoaded,
  };
};
