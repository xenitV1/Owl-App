/**
 * OCR Processor Hook
 * Manages OCR (Optical Character Recognition) functionality
 */

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import type { BlockNoteEditor } from "@blocknote/core";

export const useOCRProcessor = (t: any) => {
  const [showOCR, setShowOCR] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [ocrLanguage, setOcrLanguage] = useState("tur+eng");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles OCR image upload and text recognition
   */
  const handleOCRUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    try {
      // Use selected language for OCR recognition
      const worker = await createWorker(ocrLanguage);
      const {
        data: { text },
      } = await worker.recognize(file);
      setOcrResult(text);
      await worker.terminate();
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrResult(t("ocr.noTextFound"));
    } finally {
      setOcrProcessing(false);
    }
  };

  /**
   * Inserts OCR recognized text into the editor
   */
  const insertOCRText = (editor: BlockNoteEditor) => {
    if (ocrResult) {
      editor.insertBlocks(
        [
          {
            type: "paragraph",
            content: ocrResult,
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
      setOcrResult("");
    }
  };

  return {
    showOCR,
    setShowOCR,
    ocrProcessing,
    ocrResult,
    setOcrResult,
    ocrLanguage,
    setOcrLanguage,
    fileInputRef,
    handleOCRUpload,
    insertOCRText,
  };
};
