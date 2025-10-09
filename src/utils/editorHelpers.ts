/**
 * Editor Helper Utilities
 * Functions for editor content processing and manipulation
 */

import { BlockNoteBlock } from "@/types/richNoteEditor";
import { blobUrlToDataUrl } from "@/lib/formatConverter";

/**
 * Detects image URLs in paragraph blocks and converts them to image blocks
 */
export const detectAndConvertImageUrls = (
  blocks: any[],
  replaceBlocksCallback: (doc: any[], newBlocks: any[]) => void,
  documentRef: any[],
): boolean => {
  const imageUrlRegex =
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?/gi;
  let hasChanges = false;
  const newBlocks: any[] = [];

  for (const block of blocks) {
    if (block.type === "paragraph" && block.content) {
      const textContent = block.content
        .map((item: any) =>
          typeof item === "string" ? item : item?.text || "",
        )
        .join("");

      const imageUrls = textContent.match(imageUrlRegex);

      if (imageUrls && imageUrls.length > 0) {
        // Split the text by image URLs
        const parts = textContent.split(imageUrlRegex);
        const urls = textContent.match(imageUrlRegex) || [];

        let currentIndex = 0;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          // Add text part if it's not empty
          if (part.trim()) {
            newBlocks.push({
              type: "paragraph",
              content: [{ type: "text", text: part }],
            });
          }

          // Add image block for each URL
          if (urls[currentIndex]) {
            newBlocks.push({
              type: "image",
              props: {
                url: urls[currentIndex],
                alt: `Image from ${new URL(urls[currentIndex]).hostname}`,
              },
            });
            currentIndex++;
          }
        }
        hasChanges = true;
      } else {
        newBlocks.push(block);
      }
    } else {
      newBlocks.push(block);
    }
  }

  if (hasChanges) {
    replaceBlocksCallback(documentRef, newBlocks);
  }

  return hasChanges;
};

/**
 * Processes editor content for saving by converting blob URLs to data URLs
 */
export const processContentForSaving = async (
  leftContent: string,
  rightContent: string = "",
  splitView: boolean = false,
): Promise<string> => {
  try {
    // Try to parse as JSON first
    let leftBlocks;
    try {
      leftBlocks = JSON.parse(leftContent);
    } catch (parseError) {
      // Not JSON, likely plain markdown from AI - don't save yet, wait for proper blocks
      return JSON.stringify({
        leftContent: JSON.stringify([]),
        rightContent: JSON.stringify([]),
        splitView: false,
      });
    }

    // Process left content
    const processedLeftBlocks = await Promise.all(
      leftBlocks.map(async (block: any) => {
        if (block.type === "image" && block.props?.url) {
          const url = block.props.url;
          if (url.startsWith("blob:")) {
            try {
              const dataUrl = await blobUrlToDataUrl(url);
              return {
                ...block,
                props: {
                  ...block.props,
                  url: dataUrl,
                },
              };
            } catch (error) {
              console.error("Error converting blob URL to data URL:", error);
              return block; // Keep original if conversion fails
            }
          }
        }
        return block;
      }),
    );

    // Process right content if it exists
    let processedRightBlocks: any[] = [];
    if (rightContent) {
      const rightBlocks = JSON.parse(rightContent);
      processedRightBlocks = await Promise.all(
        rightBlocks.map(async (block: any) => {
          if (block.type === "image" && block.props?.url) {
            const url = block.props.url;
            if (url.startsWith("blob:")) {
              try {
                const dataUrl = await blobUrlToDataUrl(url);
                return {
                  ...block,
                  props: {
                    ...block.props,
                    url: dataUrl,
                  },
                };
              } catch (error) {
                console.error("Error converting blob URL to data URL:", error);
                return block; // Keep original if conversion fails
              }
            }
          }
          return block;
        }),
      );
    }

    // Create the new content structure
    const contentStructure = {
      leftContent: JSON.stringify(processedLeftBlocks),
      rightContent: JSON.stringify(processedRightBlocks),
      splitView: splitView,
    };

    return JSON.stringify(contentStructure);
  } catch (error) {
    console.error("Error processing content for saving:", error);
    // Fallback to simple structure for backward compatibility
    return leftContent;
  }
};
