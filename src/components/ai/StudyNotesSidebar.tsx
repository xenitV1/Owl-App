"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useStudyNotes } from "@/hooks/useStudyNotes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  Trash2,
  Calendar,
  Tag,
  GraduationCap,
} from "lucide-react";
import type { AppStudyNote as StudyNote } from "@/types/studyNote";

interface StudyNotesSidebarProps {
  onSelectNote: (note: StudyNote) => void;
  onGenerateFromNote?: (
    noteId: string,
    contentType: "flashcards" | "questions",
  ) => void;
}

export function StudyNotesSidebar({
  onSelectNote,
  onGenerateFromNote,
}: StudyNotesSidebarProps) {
  const t = useTranslations("ai");
  const tSidebar = useTranslations("studyNotesSidebar");
  const { notes, loading, fetchNotes, deleteNote } = useStudyNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, fetchNotes]);

  const handleSelectNote = (note: StudyNote) => {
    setSelectedNoteId(note.id);
    onSelectNote(note);
  };

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(tSidebar("deleteNoteConfirm"))) {
      await deleteNote(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    }
  };

  const handleGenerate = (
    noteId: string,
    contentType: "flashcards" | "questions",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (onGenerateFromNote) {
      onGenerateFromNote(noteId, contentType);
    }
  };

  const getAgeGroupBadge = (ageGroup: string) => {
    const colors = {
      elementary: "bg-blue-100 text-blue-800",
      middle: "bg-green-100 text-green-800",
      high: "bg-orange-100 text-orange-800",
      university: "bg-purple-100 text-purple-800",
    };

    const labels = {
      elementary: t("ageGroups.elementary"),
      middle: t("ageGroups.middle"),
      high: t("ageGroups.high"),
      university: t("ageGroups.university"),
    };

    return (
      <Badge
        variant="outline"
        className={colors[ageGroup as keyof typeof colors]}
      >
        <GraduationCap className="w-3 h-3 mr-1" />
        {labels[ageGroup as keyof typeof labels] || ageGroup}
      </Badge>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          {tSidebar("createdStudyNotes")}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {tSidebar("myStudyNotes")}
          </SheetTitle>
          <SheetDescription>{tSidebar("description")}</SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {tSidebar("noSavedNotes")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {tSidebar("noSavedNotesDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      selectedNoteId === note.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }
                  `}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">
                        {note.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-2 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(note.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {getAgeGroupBadge(note.ageGroup)}
                      {note.subject && (
                        <Badge variant="secondary" className="gap-1">
                          <Tag className="w-3 h-3" />
                          {note.subject}
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                      </Badge>
                    </div>

                    {/* Source Document */}
                    {note.sourceDocument && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {tSidebar("source")}: {note.sourceDocument}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs h-8"
                        onClick={(e) =>
                          handleGenerate(note.id, "flashcards", e)
                        }
                      >
                        <Sparkles className="w-3 h-3" />
                        {tSidebar("createFlashcard")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs h-8"
                        onClick={(e) => handleGenerate(note.id, "questions", e)}
                      >
                        <HelpCircle className="w-3 h-3" />
                        {tSidebar("createQuestionCard")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Info */}
        {notes.length > 0 && (
          <div className="absolute bottom-4 left-6 right-6">
            <Separator className="mb-3" />
            <p className="text-xs text-muted-foreground text-center">
              {tSidebar("totalNotes", { count: notes.length })}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
