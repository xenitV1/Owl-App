"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface AINotesViewerProps {
  content: string; // Markdown content
  title?: string;
  defaultExpanded?: boolean;
  maxHeight?: number; // in pixels
}

export function AINotesViewer({
  content,
  title,
  defaultExpanded = false,
  maxHeight = 400,
}: AINotesViewerProps) {
  const t = useTranslations("ai");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!content) {
    return <p className="text-sm text-muted-foreground">No notes available</p>;
  }

  // Replaced ad-hoc markdown conversion with MarkdownRenderer

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6 space-y-4">
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        <div
          className={`prose prose-sm dark:prose-invert max-w-none overflow-hidden transition-all duration-300 ${
            isExpanded ? "" : "relative"
          }`}
          style={{
            maxHeight: isExpanded ? "none" : `${maxHeight}px`,
          }}
        >
          <div className="katex-container">
            <MarkdownRenderer content={content} />
          </div>

          {/* Gradient overlay when collapsed */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>

        {/* Show More/Less Button */}
        <div className="flex justify-center pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t("showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t("showMore")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
