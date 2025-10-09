"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FontOption {
  name: string;
  value: string;
  css: string;
}

interface WebTypographySettingsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  textSpacing: number;
  setTextSpacing: (spacing: number) => void;
  wordSpacing: number;
  setWordSpacing: (spacing: number) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  FONT_OPTIONS: FontOption[];
  showAISummary: boolean;
  setShowAISummary: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export function WebTypographySettings({
  fontSize,
  setFontSize,
  textSpacing,
  setTextSpacing,
  wordSpacing,
  setWordSpacing,
  selectedFont,
  setSelectedFont,
  FONT_OPTIONS,
  showAISummary,
  setShowAISummary,
}: WebTypographySettingsProps) {
  return (
    <div className="p-4 space-y-4 min-w-[280px]">
      {/* AI Summary Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          AI Summary
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAISummary((v) => !v)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-7 px-2 text-xs"
        >
          {showAISummary ? "Hide" : "Show"}
        </Button>
      </div>
      {/* Font Selection */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Font Family
        </label>
        <Select
          value={selectedFont}
          onValueChange={(value) => setSelectedFont(value)}
        >
          <SelectTrigger
            className="w-full h-8"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.css }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Font Size: {fontSize}px
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="10"
            max="24"
            step="1"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10px</span>
            <span className="font-medium">{fontSize}px</span>
            <span>24px</span>
          </div>
        </div>
      </div>

      {/* Line Spacing */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Line Spacing: {textSpacing.toFixed(1)}
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="1.2"
            max="2.5"
            step="0.1"
            value={textSpacing}
            onChange={(e) => setTextSpacing(parseFloat(e.target.value))}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Narrow</span>
            <span className="font-medium">{textSpacing.toFixed(1)}</span>
            <span>Wide</span>
          </div>
        </div>
      </div>

      {/* Word Spacing */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Word Spacing: {wordSpacing}px
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="-2"
            max="8"
            step="0.5"
            value={wordSpacing}
            onChange={(e) => setWordSpacing(parseFloat(e.target.value))}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tight</span>
            <span className="font-medium">{wordSpacing}px</span>
            <span>Wide</span>
          </div>
        </div>
      </div>
    </div>
  );
}
