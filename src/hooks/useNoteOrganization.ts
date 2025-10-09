/**
 * Note Organization Hook
 * Manages folders and cross-references for notes
 */

import { useState } from "react";
import { NoteFolder, CrossReference } from "@/types/richNoteEditor";

export const useNoteOrganization = (cardId: string) => {
  const [showOrganization, setShowOrganization] = useState(false);
  const [showCrossReference, setShowCrossReference] = useState(false);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Creates a new folder for organizing notes
   */
  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: NoteFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        children: [],
        notes: [],
      };
      setFolders([...folders, newFolder]);
      setNewFolderName("");
    }
  };

  /**
   * Moves current note to a folder
   */
  const moveToFolder = (folderId: string) => {
    // Implementation for moving note to folder
    console.log("Moving to folder:", folderId);
    // TODO: Implement actual folder moving logic
  };

  /**
   * Creates a cross-reference link to another note
   */
  const createCrossReference = (targetNoteId: string, label: string) => {
    const newRef: CrossReference = {
      id: Date.now().toString(),
      sourceNoteId: cardId,
      targetNoteId,
      label,
    };
    setCrossReferences([...crossReferences, newRef]);
  };

  return {
    showOrganization,
    setShowOrganization,
    showCrossReference,
    setShowCrossReference,
    folders,
    crossReferences,
    selectedFolder,
    setSelectedFolder,
    newFolderName,
    setNewFolderName,
    searchQuery,
    setSearchQuery,
    createFolder,
    moveToFolder,
    createCrossReference,
  };
};
