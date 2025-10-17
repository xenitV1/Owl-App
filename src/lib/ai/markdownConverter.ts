// Smart Markdown Converter
// Converts plain PDF text to structured Markdown format
// Uses intelligent algorithms to detect headings, lists, tables, etc.

interface ConversionOptions {
  preserveFormatting?: boolean;
  detectTables?: boolean;
  detectLists?: boolean;
}

/**
 * Convert plain text to Markdown with smart formatting
 * Detects headings, lists, tables, and other structures
 *
 * @param text - Plain text extracted from PDF
 * @param options - Conversion options
 * @returns Formatted markdown string
 */
export async function convertToMarkdown(
  text: string,
  options: ConversionOptions = {},
): Promise<string> {
  const {
    preserveFormatting = true,
    detectTables = true,
    detectLists = true,
  } = options;

  let markdown = text;

  // Step 1: Clean up text
  markdown = cleanupText(markdown);

  // Step 2: Detect and format headings
  if (preserveFormatting) {
    markdown = detectHeadings(markdown);
  }

  // Step 3: Detect and format lists
  if (detectLists) {
    markdown = detectListsInText(markdown);
  }

  // Step 4: Detect and format tables (if possible)
  if (detectTables) {
    markdown = detectTablesInText(markdown);
  }

  // Step 5: Format emphasis (bold, italic)
  markdown = detectEmphasis(markdown);

  // Step 6: Format code blocks
  markdown = detectCodeBlocks(markdown);

  // Step 7: Final cleanup
  markdown = finalCleanup(markdown);

  return markdown;
}

/**
 * Clean up raw text
 */
function cleanupText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      // Remove excessive spaces
      .replace(/[ \t]+/g, " ")
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, "")
      // Normalize paragraph breaks (max 2 newlines)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Detect headings based on various patterns
 * Looks for:
 * - ALL CAPS followed by newline
 * - Numbered sections (1. Introduction, 1.1 Overview)
 * - Common heading patterns
 */
function detectHeadings(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || "";

    // Pattern 1: ALL CAPS (likely heading)
    if (
      line.length > 3 &&
      line.length < 100 &&
      line === line.toUpperCase() &&
      /^[A-Z\s]+$/.test(line)
    ) {
      result.push(
        `## ${line.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}`,
      );
      continue;
    }

    // Pattern 2: Numbered sections (1., 1.1, etc.)
    const numberedMatch = line.match(/^(\d+\.)+\s+(.+)$/);
    if (numberedMatch) {
      const level = (numberedMatch[1].match(/\./g) || []).length;
      const headingLevel = Math.min(level + 1, 6);
      result.push(`${"#".repeat(headingLevel)} ${numberedMatch[2]}`);
      continue;
    }

    // Pattern 3: Short lines followed by blank line (potential heading)
    if (
      line.length > 5 &&
      line.length < 80 &&
      !line.endsWith(".") &&
      !line.endsWith(",") &&
      nextLine === ""
    ) {
      // Check if it looks like a sentence or heading
      const wordCount = line.split(/\s+/).length;
      if (wordCount <= 8) {
        result.push(`### ${line}`);
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * Detect and format lists (bullet and numbered)
 */
function detectListsInText(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Bullet list patterns
    if (/^[•○■◆▪►▸⦿⦾]\s/.test(line)) {
      result.push(`- ${line.substring(1).trim()}`);
      continue;
    }

    // Numbered list patterns (1., 2., etc. or 1), 2), etc.)
    const numberedMatch = line.match(/^(\d+)[.)]?\s+(.+)$/);
    if (numberedMatch && numberedMatch[1].length <= 3) {
      result.push(`${numberedMatch[1]}. ${numberedMatch[2]}`);
      continue;
    }

    // Letter list patterns (a., b., etc.)
    const letterMatch = line.match(/^([a-z])[.)]?\s+(.+)$/i);
    if (letterMatch && letterMatch[1].length === 1) {
      result.push(`- ${letterMatch[2]}`);
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * Detect and format tables
 * Looks for grid-like patterns in text
 */
function detectTablesInText(text: string): string {
  // Simple table detection: lines with multiple | or tab-separated values
  const lines = text.split("\n");
  const result: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line looks like table row (has multiple | or tabs)
    const hasPipes = (line.match(/\|/g) || []).length >= 2;
    const hasTabs = (line.match(/\t/g) || []).length >= 2;

    if (hasPipes || hasTabs) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(line);
    } else {
      if (inTable && tableBuffer.length > 0) {
        // Convert buffer to markdown table
        const table = convertToMarkdownTable(tableBuffer);
        result.push(table);
        tableBuffer = [];
        inTable = false;
      }
      result.push(line);
    }
  }

  // Handle remaining table
  if (tableBuffer.length > 0) {
    const table = convertToMarkdownTable(tableBuffer);
    result.push(table);
  }

  return result.join("\n");
}

/**
 * Convert table buffer to markdown table format
 */
function convertToMarkdownTable(rows: string[]): string {
  if (rows.length === 0) return "";

  // Parse rows
  const parsedRows = rows.map((row) => {
    // Split by | or multiple spaces/tabs
    const cells = row
      .split(/\||[\t ]{2,}/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    return cells;
  });

  if (parsedRows.length === 0 || parsedRows[0].length === 0)
    return rows.join("\n");

  // Format as markdown table
  const maxCols = Math.max(...parsedRows.map((r) => r.length));
  const normalized = parsedRows.map((row) => {
    while (row.length < maxCols) row.push("");
    return row;
  });

  const header = `| ${normalized[0].join(" | ")} |`;
  const separator = `| ${normalized[0].map(() => "---").join(" | ")} |`;
  const body = normalized
    .slice(1)
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n");

  return [header, separator, body].filter(Boolean).join("\n");
}

/**
 * Detect emphasis (bold, italic) in text
 * Limited detection - mainly preserves existing formatting
 */
function detectEmphasis(text: string): string {
  // Convert common emphasis patterns
  return (
    text
      // Bold: WORD or *word*
      .replace(/\b([A-Z]{2,})\b/g, "**$1**")
      // Italic: _word_ or /word/
      .replace(/\b_([^_]+)_\b/g, "*$1*")
      .replace(/\/([^/]+)\//g, "*$1*")
  );
}

/**
 * Detect code blocks or inline code
 */
function detectCodeBlocks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like code (has special chars, indentation)
    const looksLikeCode =
      /^[\s]{4,}[^\s]/.test(line) ||
      (/[{}()[\];]/.test(line) && !/[.!?]$/.test(line));

    if (looksLikeCode && !inCodeBlock) {
      result.push("```");
      inCodeBlock = true;
    } else if (!looksLikeCode && inCodeBlock) {
      result.push("```");
      inCodeBlock = false;
    }

    result.push(line);
  }

  if (inCodeBlock) {
    result.push("```");
  }

  return result.join("\n");
}

/**
 * Final cleanup and normalization
 */
function finalCleanup(text: string): string {
  return (
    text
      // Remove excessive blank lines (max 2)
      .replace(/\n{3,}/g, "\n\n")
      // Ensure proper spacing around headings
      .replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2")
      .replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, "$1\n\n$2")
      // Ensure proper spacing around lists
      .replace(/([^\n-*\d])\n([-*]|\d+\.)\s/g, "$1\n\n$2 ")
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, "")
      .trim()
  );
}
