"use client";

import React, { useState, useEffect } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";

interface GlassSettingsPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GlassSettingsPanel: React.FC<GlassSettingsPanelProps> = ({
  isOpen: externalOpen,
  onOpenChange,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [blurValue, setBlurValue] = useState(5);
  const [refraction, setRefraction] = useState(0.21);
  const [depth, setDepth] = useState(8);

  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isGlassTheme = theme === "glass-light" || theme === "glass-dark";

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isGlassTheme) {
      const root = document.documentElement;

      // Apply settings to CSS variables
      root.style.setProperty("--glass-blur", `${blurValue}px`);
      root.style.setProperty("--glass-refraction", refraction.toString());
      root.style.setProperty("--glass-depth", depth.toString());

      // Update card opacity based on refraction (light theme: higher opacity, dark: lower)
      const cardOpacity =
        theme === "glass-light" ? refraction : refraction * 0.4;
      root.style.setProperty("--glass-opacity", cardOpacity.toString());

      // Update card background with refraction
      const cardBg =
        theme === "glass-light"
          ? `rgba(255, 255, 255, ${refraction})`
          : `rgba(255, 255, 255, ${refraction * 0.4})`;
      root.style.setProperty("--card", cardBg);

      // Update input background
      const inputBg =
        theme === "glass-light"
          ? `rgba(255, 255, 255, ${refraction * 0.9})`
          : `rgba(255, 255, 255, ${refraction * 0.35})`;
      root.style.setProperty("--input", inputBg);

      // Update border opacity
      const borderOpacity = Math.max(0.18, refraction * 1.4);
      const borderColor = `rgba(255, 255, 255, ${Math.min(borderOpacity, 0.5)})`;
      root.style.setProperty("--border", borderColor);

      // Save to localStorage
      try {
        localStorage.setItem(
          "glass-settings",
          JSON.stringify({ blurValue, refraction, depth }),
        );
      } catch (error) {
        console.error("Failed to save glass settings:", error);
      }
    }
  }, [blurValue, refraction, depth, isGlassTheme, theme]);

  useEffect(() => {
    // Load saved settings on mount
    try {
      const saved = localStorage.getItem("glass-settings");
      if (saved) {
        const settings = JSON.parse(saved);
        const loadedBlur = settings.blurValue || 5;
        const loadedRefraction = settings.refraction || 0.21;
        const loadedDepth = settings.depth || 8;

        setBlurValue(loadedBlur);
        setRefraction(loadedRefraction);
        setDepth(loadedDepth);

        // Apply immediately if on glass theme
        if (isGlassTheme) {
          const root = document.documentElement;
          root.style.setProperty("--glass-blur", `${loadedBlur}px`);
          root.style.setProperty(
            "--glass-refraction",
            loadedRefraction.toString(),
          );
          root.style.setProperty("--glass-depth", loadedDepth.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load glass settings:", error);
    }
  }, [isGlassTheme]);

  const resetToDefaults = () => {
    setBlurValue(5);
    setRefraction(0.21);
    setDepth(8);
  };

  // Don't render on server or if not glass theme
  if (!mounted || !isGlassTheme) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Settings</SheetTitle>
          <SheetDescription>
            Adjust your glassmorphism effect parameters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Blur Value */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="blur-slider" className="text-sm font-medium">
                Blur value
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                {blurValue}
              </span>
            </div>
            <input
              id="blur-slider"
              type="range"
              min="0"
              max="20"
              step="1"
              value={blurValue}
              onChange={(e) => setBlurValue(Number(e.target.value))}
              className="glass-slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Refraction */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="refraction-slider"
                className="text-sm font-medium"
              >
                Refraction
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                {refraction.toFixed(2)}
              </span>
            </div>
            <input
              id="refraction-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={refraction}
              onChange={(e) => setRefraction(Number(e.target.value))}
              className="glass-slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Depth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="depth-slider" className="text-sm font-medium">
                Depth
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">
                {depth}
              </span>
            </div>
            <input
              id="depth-slider"
              type="range"
              min="0"
              max="20"
              step="1"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="glass-slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Live Preview Card */}
          <div
            className="p-6 rounded-xl border relative overflow-hidden"
            style={{
              background: `rgba(255, 255, 255, ${theme === "glass-light" ? refraction : refraction * 0.4})`,
              borderColor: `rgba(255, 255, 255, ${Math.min(refraction * 1.4, 0.5)})`,
              backdropFilter: `blur(${blurValue}px)`,
              WebkitBackdropFilter: `blur(${blurValue}px)`,
              boxShadow: `
                0 ${depth}px ${depth * 4}px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                inset 0 0 ${depth * 2}px ${depth}px rgba(255, 255, 255, ${refraction})
              `,
            }}
          >
            <div className="text-center">
              <p className="text-sm font-semibold mb-1">Live Preview</p>
              <p className="text-xs text-muted-foreground">
                This card reflects your current settings
              </p>
            </div>
            {/* Light reflections */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${refraction * 3.8}), transparent)`,
                opacity: refraction,
              }}
            />
            <div
              className="absolute top-0 left-0 bottom-0 w-px"
              style={{
                background: `linear-gradient(180deg, rgba(255, 255, 255, ${refraction * 3.8}), transparent, rgba(255, 255, 255, ${refraction * 1.4}))`,
                opacity: refraction,
              }}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-2">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-semibold mb-2">💡 Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Blur</strong>: Controls the frosted glass effect
                intensity
              </li>
              <li>
                <strong>Refraction</strong>: Adjusts transparency and light
                refraction
              </li>
              <li>
                <strong>Depth</strong>: Changes shadow depth for 3D effect
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
