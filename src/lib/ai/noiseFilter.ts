// Heuristic noise filter for PDF/OCR text
// - Removes repeated headers/footers across pages
// - Strips page numbers and page markers
// - Optionally drops References/Bibliography sections

export interface NoiseFilterOptions {
  excludeReferences?: boolean; // default true
  minLineLength?: number; // default 3
}

const DEFAULT_OPTIONS: Required<NoiseFilterOptions> = {
  excludeReferences: true,
  minLineLength: 3,
};

const PAGE_NUMBER_REGEX = /^(?:page\s*\d+\s*(?:of\s*\d+)?)$|^\d{1,4}$/i;
const REFERENCES_HEADINGS = /^(references|kaynakça|bibliography|sources)\b/i;

// Compute frequent header/footer candidates by comparing first/last lines across pages
function detectRepeatedLines(pages: string[][]): {
  headers: Set<string>;
  footers: Set<string>;
} {
  const firstLines: Record<string, number> = {};
  const lastLines: Record<string, number> = {};

  for (const lines of pages) {
    if (lines.length === 0) continue;
    const first = lines[0].trim();
    const last = lines[lines.length - 1].trim();
    if (first) firstLines[first] = (firstLines[first] || 0) + 1;
    if (last) lastLines[last] = (lastLines[last] || 0) + 1;
  }

  const threshold = Math.max(2, Math.floor(pages.length * 0.3));
  const headers = new Set(
    Object.keys(firstLines).filter((k) => firstLines[k] >= threshold),
  );
  const footers = new Set(
    Object.keys(lastLines).filter((k) => lastLines[k] >= threshold),
  );
  return { headers, footers };
}

export function filterNoiseFromPages(
  pageTexts: string[],
  opts?: NoiseFilterOptions,
): string {
  const options = { ...DEFAULT_OPTIONS, ...opts };

  // Split into lines per page
  const pages = pageTexts.map((p) =>
    p
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );

  // Detect repeated header/footer
  const { headers, footers } = detectRepeatedLines(pages);

  const cleanedPages: string[] = [];
  let referencesMode = false;

  for (let i = 0; i < pages.length; i++) {
    const lines = pages[i];
    const out: string[] = [];

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      const isHeader = j === 0 && headers.has(line);
      const isFooter = j === lines.length - 1 && footers.has(line);
      if (isHeader || isFooter) continue;

      if (PAGE_NUMBER_REGEX.test(line.replace(/[–—-]/g, "-").toLowerCase()))
        continue;
      if (line.length < options.minLineLength) continue;

      if (options.excludeReferences) {
        if (REFERENCES_HEADINGS.test(line)) {
          referencesMode = true;
          continue;
        }
        if (referencesMode) {
          // skip lines after references heading
          continue;
        }
      }

      out.push(line);
    }

    cleanedPages.push(out.join("\n"));
  }

  return cleanedPages.filter(Boolean).join("\n\n");
}

export function filterNoiseFromMergedText(
  mergedText: string,
  opts?: NoiseFilterOptions,
): string {
  // Fallback: treat entire text as single page
  return filterNoiseFromPages([mergedText], opts);
}
