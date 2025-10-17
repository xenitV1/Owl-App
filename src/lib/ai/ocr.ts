// Lightweight OCR helper using Tesseract.js (loaded dynamically on client)
// Note: Runs on client only. For large files or server OCR, consider a server-side service.

export interface OCRParams {
  language?: string; // e.g., 'eng', 'tur', 'eng+tur'
  onProgress?: (percentage: number, status: string) => void;
}

export async function runOCRFromFile(
  file: File,
  params: OCRParams = {},
): Promise<string> {
  const { language = "eng", onProgress } = params;

  const Tesseract = await import("tesseract.js");

  // Use a Blob URL to avoid reading full file into memory twice
  const url = URL.createObjectURL(file);
  try {
    const result = await Tesseract.recognize(url, language, {
      logger: (m: any) => {
        if (onProgress && m?.progress != null) {
          const pct = Math.round((m.progress as number) * 100);
          onProgress(pct, m.status || "ocr");
        }
      },
    });

    return (result?.data?.text || "").trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function runOCRFromImageData(
  data: Blob | ArrayBuffer,
  params: OCRParams = {},
): Promise<string> {
  const { language = "eng", onProgress } = params;
  const Tesseract = await import("tesseract.js");

  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data]);
  }

  const url = URL.createObjectURL(blob);
  try {
    const result = await Tesseract.recognize(url, language, {
      logger: (m: any) => {
        if (onProgress && m?.progress != null) {
          const pct = Math.round((m.progress as number) * 100);
          onProgress(pct, m.status || "ocr");
        }
      },
    });
    return (result?.data?.text || "").trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}
