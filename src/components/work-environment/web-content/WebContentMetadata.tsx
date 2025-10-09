"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { User, Clock, Globe, ExternalLink } from "lucide-react";

interface WebContentMetadataProps {
  author?: string;
  publishedTime?: string;
  siteName?: string;
  url: string;
}

export function WebContentMetadata({
  author,
  publishedTime,
  siteName,
  url,
}: WebContentMetadataProps) {
  return (
    <div className="pt-6 border-t border-border/50">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {author && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{author}</span>
          </div>
        )}
        {publishedTime && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(publishedTime).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
        <Globe className="h-3 w-3 text-muted-foreground" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate flex-1"
        >
          {siteName || new URL(url).hostname}
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="h-6 px-2 text-xs"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
