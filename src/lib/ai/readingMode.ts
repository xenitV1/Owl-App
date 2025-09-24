// Lightweight local "AI-like" reading-mode utilities without external APIs

export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZİIŞÇĞÜÖ0-9])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ığüşöçıâêîûéáà’'`-]+/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildWordFrequencies(words: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length <= 2) continue; // drop very short tokens
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return freq;
}

export function summarizeText(text: string, sentenceCount = 3): string {
  // Normalize: drop image placeholders or noisy artifacts
  const normalized = text
    .replace(/\[Image:[^\]]*\]/gi, ' ')
    .replace(/\b(share this|read more|sponsored|advertisement|related articles?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = splitIntoSentences(normalized);
  if (sentences.length <= sentenceCount) return text;

  const allWords = tokenize(normalized);
  const freq = buildWordFrequencies(allWords);
  const maxFreq = Math.max(...Array.from(freq.values()), 1);

  // Normalize frequencies
  for (const [k, v] of freq) freq.set(k, v / maxFreq);

  // Score sentences by sum of normalized word frequencies
  const scored = sentences.map((s, idx) => {
    const words = tokenize(s);
    const score = words.reduce((sum, w) => sum + (freq.get(w) || 0), 0) / Math.max(words.length, 1);
    return { idx, s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, sentenceCount).sort((a, b) => a.idx - b.idx);
  return top.map(t => t.s).join(' ');
}

export function structurePlainText(text: string): { type: 'paragraph'; content: string }[] {
  if (!text) return [];
  const parts = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  return parts.map(p => ({ type: 'paragraph' as const, content: p }));
}


