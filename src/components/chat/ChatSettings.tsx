"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Type, Palette, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Theme context is not required here; removed unused import

interface ChatSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatSettings {
  fontSize: "small" | "medium" | "large";
  fontFamily: string;
  messageColor: string; // custom color when not following theme
  backgroundColor: string; // custom color when not following theme
  timestampFormat: "12h" | "24h";
  showAvatars: boolean;
  compactMode: boolean;
  useThemeColors: boolean; // when true, follow current app theme colors
}

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small", size: "12px" },
  { value: "medium", label: "Medium", size: "14px" },
  { value: "large", label: "Large", size: "16px" },
];

const FONT_FAMILY_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "System", label: "System UI" },
  { value: "Monospace", label: "Monospace" },
];

const COLOR_PRESETS = [
  { name: "Default", message: "#000000", background: "#ffffff" },
  { name: "Dark", message: "#ffffff", background: "#1f2937" },
  { name: "Sepia", message: "#5c4b37", background: "#f4f1ea" },
  { name: "High Contrast", message: "#ffffff", background: "#000000" },
];

export function ChatSettings({ isOpen, onOpenChange }: ChatSettingsProps) {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    fontSize: "medium",
    fontFamily: "Inter",
    messageColor: "#000000",
    backgroundColor: "#ffffff",
    timestampFormat: "12h",
    showAvatars: true,
    compactMode: false,
    useThemeColors: true,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("chat-settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error("Failed to load chat settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("chat-settings", JSON.stringify(settings));

        // Apply settings to CSS custom properties
        const root = document.documentElement;

        // Font size
        const fontSize =
          FONT_SIZE_OPTIONS.find((opt) => opt.value === settings.fontSize)
            ?.size || "14px";
        root.style.setProperty("--chat-font-size", fontSize);

        // Font family
        root.style.setProperty("--chat-font-family", settings.fontFamily);

        // Message/background colors (respect theme when enabled)
        if (settings.useThemeColors) {
          root.style.removeProperty("--chat-message-color");
          root.style.removeProperty("--chat-background-color");
        } else {
          root.style.setProperty("--chat-message-color", settings.messageColor);
          root.style.setProperty(
            "--chat-background-color",
            settings.backgroundColor,
          );
        }

        // Compact mode
        root.style.setProperty(
          "--chat-compact-mode",
          settings.compactMode ? "1" : "0",
        );

        // Avatar visibility
        root.style.setProperty(
          "--chat-show-avatars",
          settings.showAvatars ? "1" : "0",
        );

        // Notify chat components about settings change
        window.dispatchEvent(new CustomEvent("chat-settings-changed"));
      } catch (error) {
        console.error("Failed to save chat settings:", error);
      }
    }
  }, [settings]);

  const resetToDefaults = () => {
    setSettings({
      fontSize: "medium",
      fontFamily: "Inter",
      messageColor: "#000000",
      backgroundColor: "#ffffff",
      timestampFormat: "12h",
      showAvatars: true,
      compactMode: false,
      useThemeColors: true,
    });
  };

  const applyColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setSettings((prev) => ({
      ...prev,
      messageColor: preset.message,
      backgroundColor: preset.background,
    }));
  };

  // Don't render on server
  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Chat Settings
          </DialogTitle>
          <DialogDescription>
            Customize your chat experience with these settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Font Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <Label className="text-base font-medium">Font Settings</Label>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value: any) =>
                  setSettings((prev) => ({ ...prev, fontSize: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({option.size})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(value: any) =>
                  setSettings((prev) => ({ ...prev, fontFamily: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <Label className="text-base font-medium">Color Settings</Label>
            </div>

            {/* Follow Theme Colors Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="use-theme-colors">
                Use Theme Colors (Default)
              </Label>
              <Switch
                id="use-theme-colors"
                checked={settings.useThemeColors}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, useThemeColors: checked }))
                }
              />
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-3 justify-start"
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        useThemeColors: false,
                      }));
                      applyColorPreset(preset);
                    }}
                    disabled={settings.useThemeColors}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: preset.message }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: preset.background }}
                      />
                      <span className="text-sm">{preset.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="message-color">Message Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="message-color"
                    type="color"
                    value={settings.messageColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        messageColor: e.target.value,
                      }))
                    }
                    className="w-16 h-10 p-1"
                    disabled={settings.useThemeColors}
                  />
                  <Input
                    value={settings.messageColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        messageColor: e.target.value,
                      }))
                    }
                    placeholder="#000000"
                    className="flex-1"
                    disabled={settings.useThemeColors}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="w-16 h-10 p-1"
                    disabled={settings.useThemeColors}
                  />
                  <Input
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    placeholder="#ffffff"
                    className="flex-1"
                    disabled={settings.useThemeColors}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <Label className="text-base font-medium">Display Settings</Label>
            </div>

            {/* Timestamp Format */}
            <div className="space-y-2">
              <Label htmlFor="timestamp-format">Timestamp Format</Label>
              <Select
                value={settings.timestampFormat}
                onValueChange={(value: any) =>
                  setSettings((prev) => ({ ...prev, timestampFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timestamp format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-avatars">Show Avatars</Label>
                <Switch
                  id="show-avatars"
                  checked={settings.showAvatars}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, showAvatars: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch
                  id="compact-mode"
                  checked={settings.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: settings.useThemeColors
                  ? undefined
                  : settings.backgroundColor,
                fontFamily:
                  settings.fontFamily === "System"
                    ? "system-ui, -apple-system, sans-serif"
                    : settings.fontFamily.toLowerCase(),
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-sm"
                      style={{
                        color: settings.useThemeColors
                          ? undefined
                          : settings.messageColor,
                        fontSize:
                          FONT_SIZE_OPTIONS.find(
                            (opt) => opt.value === settings.fontSize,
                          )?.size || "14px",
                      }}
                    >
                      This is how your messages will appear
                    </div>
                    <div className="text-xs text-muted-foreground">2:30 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
