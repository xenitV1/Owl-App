import { useState, useCallback } from "react";
import type {
  AppStudyNote as StudyNote,
  AppCreateStudyNoteRequest as CreateStudyNoteRequest,
  AppUpdateStudyNoteRequest as UpdateStudyNoteRequest,
} from "@/types/studyNote";

interface UseStudyNotesReturn {
  notes: StudyNote[];
  loading: boolean;
  error: string | null;
  fetchNotes: (params?: {
    page?: number;
    pageSize?: number;
    subject?: string;
    ageGroup?: string;
  }) => Promise<void>;
  createNote: (data: CreateStudyNoteRequest) => Promise<StudyNote | null>;
  updateNote: (
    id: string,
    data: UpdateStudyNoteRequest,
  ) => Promise<StudyNote | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNote: (id: string) => Promise<StudyNote | null>;
  generateFromNote: (
    noteId: string,
    contentType: "flashcards" | "questions",
    params?: { cardCount?: number; language?: string; ageGroup?: string },
  ) => Promise<any>;
}

export function useStudyNotes(): UseStudyNotesReturn {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(
    async (params?: {
      page?: number;
      pageSize?: number;
      subject?: string;
      ageGroup?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.pageSize)
          queryParams.set("pageSize", params.pageSize.toString());
        if (params?.subject) queryParams.set("subject", params.subject);
        if (params?.ageGroup) queryParams.set("ageGroup", params.ageGroup);

        const response = await fetch(
          `/api/study-notes?${queryParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch study notes");
        }

        const data = await response.json();
        setNotes(data.notes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching study notes:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createNote = useCallback(
    async (data: CreateStudyNoteRequest): Promise<StudyNote | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/study-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create study note");
        }

        const note = await response.json();
        setNotes((prev) => [note, ...prev]);
        return note;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error creating study note:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateNote = useCallback(
    async (
      id: string,
      data: UpdateStudyNoteRequest,
    ): Promise<StudyNote | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/study-notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update study note");
        }

        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updatedNote : note)),
        );
        return updatedNote;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error updating study note:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/study-notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete study note");
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting study note:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNote = useCallback(async (id: string): Promise<StudyNote | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/study-notes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch study note");
      }

      const note = await response.json();
      return note;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching study note:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFromNote = useCallback(
    async (
      noteId: string,
      contentType: "flashcards" | "questions",
      params?: { cardCount?: number; language?: string; ageGroup?: string },
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/study-notes/${noteId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType,
            ...params,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate content from study note");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error generating from study note:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    generateFromNote,
  };
}
