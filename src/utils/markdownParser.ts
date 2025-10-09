/**
 * Markdown Parser Utilities
 * Converts markdown text to BlockNote editor blocks
 */

import { BlockNoteBlock } from "@/types/richNoteEditor";

/**
 * Parses inline styles from markdown text (bold, italic, code, links)
 */
export const parseInlineStyles = (text: string): any[] => {
  const parts: any[] = [];
  let currentIndex = 0;

  // Regex for: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push({
        type: "text",
        text: text.slice(currentIndex, match.index),
        styles: {},
      });
    }

    const matched = match[0];

    // Bold **text**
    if (matched.startsWith("**") && matched.endsWith("**")) {
      parts.push({
        type: "text",
        text: matched.slice(2, -2),
        styles: { bold: true },
      });
    }
    // Italic *text*
    else if (
      matched.startsWith("*") &&
      matched.endsWith("*") &&
      !matched.startsWith("**")
    ) {
      parts.push({
        type: "text",
        text: matched.slice(1, -1),
        styles: { italic: true },
      });
    }
    // Inline code `code`
    else if (matched.startsWith("`") && matched.endsWith("`")) {
      parts.push({
        type: "text",
        text: matched.slice(1, -1),
        styles: { code: true },
      });
    }
    // Link [text](url)
    else if (match[2] && match[3]) {
      parts.push({
        type: "link",
        content: [{ type: "text", text: match[2], styles: {} }],
        href: match[3],
      });
    }

    currentIndex = match.index + matched.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({
      type: "text",
      text: text.slice(currentIndex),
      styles: {},
    });
  }

  return parts.length > 0 ? parts : [{ type: "text", text, styles: {} }];
};

/**
 * Converts markdown text to BlockNote blocks
 */
export const parseMarkdownToBlocks = (
  markdownText: string,
): BlockNoteBlock[] => {
  const blocks: BlockNoteBlock[] = [];
  const lines = markdownText.split("\n");
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLanguage = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: "codeBlock",
          props: { language: codeLanguage || "plaintext" },
          content: [{ type: "text", text: codeContent.join("\n"), styles: {} }],
        });
        inCodeBlock = false;
        codeContent = [];
        codeLanguage = "";
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Headings (# ## ###)
    if (trimmed.startsWith("#")) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#+\s*/, "");
      blocks.push({
        type: "heading",
        props: { level: Math.min(level, 3) },
        content: parseInlineStyles(text),
      });
    }
    // Bullet list (- or *)
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.slice(2);
      blocks.push({
        type: "bulletListItem",
        content: parseInlineStyles(text),
      });
    }
    // Numbered list (1. 2. 3.)
    else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, "");
      blocks.push({
        type: "numberedListItem",
        content: parseInlineStyles(text),
      });
    }
    // Blockquote (>)
    else if (trimmed.startsWith("> ")) {
      const text = trimmed.slice(2);
      blocks.push({
        type: "paragraph",
        content: parseInlineStyles(text),
      });
    }
    // Horizontal rule (---)
    else if (trimmed === "---" || trimmed === "***") {
      // BlockNote doesn't have hr, skip
      continue;
    }
    // Regular paragraph
    else {
      blocks.push({
        type: "paragraph",
        content: parseInlineStyles(trimmed),
      });
    }
  }

  return blocks;
};
