"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StructuredContentItem {
  type: string;
  content?: string;
  level?: number;
  items?: string[];
  src?: string;
  alt?: string;
}

interface WebContentRendererProps {
  structuredContent?: StructuredContentItem[];
  displayContent: string;
  showFullContent: boolean;
  setShowFullContent: (show: boolean) => void;
  getTypographyStyles: (
    element: "heading" | "paragraph" | "quote",
  ) => React.CSSProperties;
  fontSize: number;
  wordSpacing: number;
}

export function WebContentRenderer({
  structuredContent,
  displayContent,
  showFullContent,
  setShowFullContent,
  getTypographyStyles,
  fontSize,
  wordSpacing,
}: WebContentRendererProps) {
  // Render structured content
  const renderStructuredContent = (
    items: StructuredContentItem[],
    isFullContent: boolean,
  ) => {
    if (!items) return null;

    const elements: React.ReactElement[] = [];
    let itemCount = 0;
    const maxItems = isFullContent ? items.length : 8;

    for (const item of items) {
      if (itemCount >= maxItems) break;

      switch (item.type) {
        case "heading":
          const headingLevel = Math.min(item.level || 1, 4);
          const headingFontSize =
            headingLevel === 1
              ? fontSize + 8
              : headingLevel === 2
                ? fontSize + 4
                : headingLevel === 3
                  ? fontSize + 2
                  : fontSize;

          const headingStyles = getTypographyStyles("heading");
          headingStyles.fontSize = `${headingFontSize}px`;
          headingStyles.wordSpacing = `${wordSpacing * 0.5}px`;

          const HeadingComponent = React.createElement(
            `h${headingLevel}`,
            {
              key: itemCount,
              className: `font-bold mt-6 mb-3 text-foreground`,
              style: headingStyles,
            },
            item.content,
          );
          elements.push(HeadingComponent);
          break;

        case "paragraph":
          elements.push(
            <p
              key={itemCount}
              className="text-foreground/90 mb-4"
              style={getTypographyStyles("paragraph")}
            >
              {item.content}
            </p>,
          );
          break;

        case "list":
          elements.push(
            <ul
              key={itemCount}
              className="list-disc list-inside mb-4 space-y-1 text-foreground/90"
            >
              {item.items?.map((listItem: string, listIndex: number) => (
                <li key={listIndex} style={getTypographyStyles("paragraph")}>
                  {listItem}
                </li>
              ))}
            </ul>,
          );
          break;

        case "quote":
          elements.push(
            <blockquote
              key={itemCount}
              className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4"
              style={getTypographyStyles("quote")}
            >
              {item.content}
            </blockquote>,
          );
          break;

        case "image":
          elements.push(
            <div key={itemCount} className="mb-6">
              <img
                src={item.src}
                alt={item.alt || item.content}
                className="w-full max-w-lg h-auto rounded-lg shadow-sm mx-auto block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {item.alt && (
                <p className="text-xs text-muted-foreground mt-2 italic text-center">
                  {item.alt}
                </p>
              )}
            </div>,
          );
          break;
      }

      itemCount++;
    }

    return elements;
  };

  // Format content into readable paragraphs (fallback for non-structured content)
  const formatContent = (text: string, isFullContent: boolean = false) => {
    if (!text) return [];

    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    return paragraphs
      .map((para, index) => {
        const cleaned = para.trim();

        if (!isFullContent && index >= 3 && cleaned.length > 100) {
          return null;
        }

        return cleaned;
      })
      .filter(Boolean);
  };

  const hasStructuredContent =
    structuredContent && structuredContent.length > 0;
  const structuredElements = hasStructuredContent
    ? renderStructuredContent(structuredContent, showFullContent)
    : null;
  const paragraphs = !hasStructuredContent
    ? formatContent(displayContent, showFullContent)
    : [];
  const hasMoreContent = hasStructuredContent
    ? (structuredContent?.length || 0) > 8
    : formatContent(displayContent, true).length > paragraphs.length;

  return (
    <div className="space-y-4">
      {hasStructuredContent && structuredElements ? (
        <div className="max-w-none">
          {structuredElements}

          {hasMoreContent && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-primary hover:text-primary/80"
              >
                {showFullContent ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Read More
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : paragraphs.length > 0 ? (
        <div className="space-y-4 max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-foreground/90"
              style={getTypographyStyles("paragraph")}
            >
              {paragraph}
            </p>
          ))}

          {hasMoreContent && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-primary hover:text-primary/80"
              >
                {showFullContent ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Read More
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No readable content available</p>
        </div>
      )}
    </div>
  );
}
