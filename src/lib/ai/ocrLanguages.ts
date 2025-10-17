export type OCRLanguage = {
  label: string; // Human readable
  code: string; // Tesseract language code
};

// Common set; extend as needed. Tesseract supports many languages if traineddata is available.
export const OCR_LANGUAGES: OCRLanguage[] = [
  { label: "English", code: "eng" },
  { label: "Türkçe", code: "tur" },
  { label: "Deutsch", code: "deu" },
  { label: "Français", code: "fra" },
  { label: "Español", code: "spa" },
  { label: "Italiano", code: "ita" },
  { label: "Português", code: "por" },
  { label: "Русский", code: "rus" },
  { label: "中文 (Simplified)", code: "chi_sim" },
  { label: "中文 (Traditional)", code: "chi_tra" },
  { label: "日本語", code: "jpn" },
  { label: "한국어", code: "kor" },
  { label: "العربية", code: "ara" },
  { label: "हिन्दी", code: "hin" },
  { label: "Polski", code: "pol" },
  { label: "Nederlands", code: "nld" },
  { label: "Svenska", code: "swe" },
  { label: "Čeština", code: "ces" },
  { label: "Ελληνικά", code: "ell" },
  { label: "Magyar", code: "hun" },
];

export function buildLanguageCode(selectedCodes: string[]): string {
  return selectedCodes.filter(Boolean).join("+");
}
