"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, ExternalLink } from "lucide-react";
import { WebTypographySettings } from "./WebTypographySettings";

interface WebContentHeaderProps {
  title?: string;
  content: any;
  url: string;
  fontSize: number;
  setFontSize: (size: number) => void;
  textSpacing: number;
  setTextSpacing: (spacing: number) => void;
  wordSpacing: number;
  setWordSpacing: (spacing: number) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  FONT_OPTIONS: Array<{ name: string; value: string; css: string }>;
  showAISummary: boolean;
  setShowAISummary: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export function WebContentHeader({
  title,
  content,
  url,
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
}: WebContentHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium flex items-center gap-2 min-w-0 flex-1">
        <span className="text-lg">🌐</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {content?.title || title || "Web Page"}
          </div>
          {content?.siteName && (
            <div className="text-xs text-muted-foreground truncate">
              {content.siteName}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          Web Content
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <WebTypographySettings
              fontSize={fontSize}
              setFontSize={setFontSize}
              textSpacing={textSpacing}
              setTextSpacing={setTextSpacing}
              wordSpacing={wordSpacing}
              setWordSpacing={setWordSpacing}
              selectedFont={selectedFont}
              setSelectedFont={setSelectedFont}
              FONT_OPTIONS={FONT_OPTIONS}
              showAISummary={showAISummary}
              setShowAISummary={setShowAISummary}
            />
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
