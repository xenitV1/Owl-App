/**
 * Custom Hook for Flashcard Media Handling
 * Manages media file upload, preview, and validation
 */

import { useState, useCallback } from "react";
import { FlashcardFormState } from "@/types/flashcard";

interface UseFlashcardMediaResult {
  formState: FlashcardFormState;
  handleFileSelect: (
    event: React.ChangeEvent<HTMLInputElement>,
    onError: (msg: string) => void,
  ) => void;
  removeFile: () => void;
  resetForm: () => void;
  setFormField: <K extends keyof FlashcardFormState>(
    field: K,
    value: FlashcardFormState[K],
  ) => void;
  setForm: (form: FlashcardFormState) => void;
}

const defaultFormState: FlashcardFormState = {
  front: "",
  back: "",
  type: "text",
  category: "",
  tags: "",
  mediaFile: null,
  mediaPreview: "",
};

export function useFlashcardMedia(
  initialState?: Partial<FlashcardFormState>,
): UseFlashcardMediaResult {
  const [formState, setFormState] = useState<FlashcardFormState>({
    ...defaultFormState,
    ...initialState,
  });

  const resetForm = useCallback(() => {
    setFormState(defaultFormState);
  }, []);

  const setFormField = useCallback(
    <K extends keyof FlashcardFormState>(
      field: K,
      value: FlashcardFormState[K],
    ) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setForm = useCallback((form: FlashcardFormState) => {
    setFormState(form);
  }, []);

  const removeFile = useCallback(() => {
    setFormState((prev) => ({ ...prev, mediaFile: null, mediaPreview: "" }));
  }, []);

  const getMediaTypeFromFile = useCallback(
    (file: File): "image" | "audio" | "video" => {
      if (file.type.startsWith("image/")) return "image";
      if (file.type.startsWith("audio/")) return "audio";
      if (file.type.startsWith("video/")) return "video";
      return "image"; // fallback
    },
    [],
  );

  const handleFileSelect = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      onError: (msg: string) => void,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
      ];

      if (!validTypes.includes(file.type)) {
        onError("invalidFileType");
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        onError("fileTooLarge");
        return;
      }

      // Update form state with file
      setFormState((prev) => ({
        ...prev,
        mediaFile: file,
        type: getMediaTypeFromFile(file),
      }));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormState((prev) => ({
            ...prev,
            mediaPreview: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    [getMediaTypeFromFile],
  );

  return {
    formState,
    handleFileSelect,
    removeFile,
    resetForm,
    setFormField,
    setForm,
  };
}
