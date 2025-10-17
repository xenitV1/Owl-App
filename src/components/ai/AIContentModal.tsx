"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploader } from "./DocumentUploader";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { AgeGroupSelector } from "./AgeGroupSelector";
import { OutputLanguageSelector } from "./OutputLanguageSelector";
import { CardCountSelector } from "./CardCountSelector";
import { AIGeneratedPreview } from "./AIGeneratedPreview";
import { StudyNotesSidebar } from "./StudyNotesSidebar";
import type { ContentType, AgeGroup, GeneratedContent } from "@/types/ai";
import type { AppStudyNote as StudyNote } from "@/types/studyNote";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudyNotes } from "@/hooks/useStudyNotes";

interface AIContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (content: GeneratedContent) => void;
}

type Step = "upload" | "configure" | "generating" | "preview";

export function AIContentModal({
  isOpen,
  onClose,
  onGenerated,
}: AIContentModalProps) {
  const t = useTranslations("ai");
  const tModal = useTranslations("aiModal");
  const locale = useLocale();
  const { toast } = useToast();
  const { generateFromNote } = useStudyNotes();

  const [step, setStep] = useState<Step>("upload");
  const [documentText, setDocumentText] = useState("");
  const [documentFilename, setDocumentFilename] = useState("");
  const [contentType, setContentType] = useState<ContentType>();
  const [ageGroup, setAgeGroup] = useState<AgeGroup>();
  const [subject, setSubject] = useState("");
  const [outputLanguage, setOutputLanguage] = useState<string>(String(locale)); // Default to current locale
  const [cardCount, setCardCount] = useState<number>(15); // Default 15 cards
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");

  const resetModal = () => {
    setStep("upload");
    setDocumentText("");
    setDocumentFilename("");
    setContentType(undefined);
    setAgeGroup(undefined);
    setSubject("");
    setOutputLanguage(String(locale));
    setCardCount(15);
    setGeneratedContent(null);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDocumentParsed = (text: string, filename: string) => {
    setDocumentText(text);
    setDocumentFilename(filename);
    setStep("configure");
  };

  const handleGenerateContent = async () => {
    if (!contentType || !ageGroup || !documentText) {
      toast({
        title: t("error"),
        description: t("missingFields"),
        variant: "destructive",
      });
      return;
    }

    setStep("generating");
    setIsGenerating(true);
    setGenerationProgress(0);

    // Advanced progress calculation based on document size
    const documentLength = documentText.length;
    const isLargeDocument = documentLength > 40000;
    const estimatedChunks = Math.ceil(documentLength / 40000);
    const estimatedBatches = Math.ceil(estimatedChunks / 3); // 3 chunks per batch

    if (isLargeDocument) {
      setProcessingMessage(
        t("processingLargeDocument", {
          chunks: estimatedChunks,
          batches: estimatedBatches,
        }),
      );
    }

    // Smart progress simulation based on document complexity
    let progressStep = 0;
    const totalSteps = estimatedBatches + 2; // batches + analyzing + merging
    const progressInterval = setInterval(
      () => {
        progressStep++;
        const progressPercent = Math.min((progressStep / totalSteps) * 100, 95);

        if (progressStep <= estimatedBatches) {
          setProcessingMessage(
            tModal("processingAI", {
              current: progressStep,
              total: estimatedBatches,
            }),
          );
        } else if (progressStep === totalSteps - 1) {
          setProcessingMessage(tModal("mergingResults"));
        } else {
          setProcessingMessage(tModal("completing"));
        }

        setGenerationProgress(progressPercent);
      },
      isLargeDocument ? 2000 : 1000,
    ); // Slower progress for large docs

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          documentContent: documentText,
          ageGroup,
          language: outputLanguage, // Use selected output language
          subject: subject || undefined,
          cardCount: contentType !== "notes" ? cardCount : undefined, // Only for flashcards/questions
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Generation failed");
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Convert metadata date string back to Date
      const content: GeneratedContent = {
        ...data.data,
        metadata: {
          ...data.data.metadata,
          generatedAt: new Date(data.data.metadata.generatedAt),
        },
      };

      setGeneratedContent(content);
      setStep("preview");

      toast({
        title: t("success"),
        description: t("generated"),
      });
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
      setStep("configure");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onGenerated(generatedContent);
      handleClose();
    }
  };

  const handleSelectNote = (note: StudyNote) => {
    setDocumentText(note.content);
    setDocumentFilename(note.title);
    setSubject(note.subject || "");
    setAgeGroup(note.ageGroup as AgeGroup);
    setOutputLanguage(note.language || String(locale));
    setStep("configure");
    toast({
      title: tModal("noteSelected"),
      description: tModal("noteSelectedDescription", { title: note.title }),
    });
  };

  const handleGenerateFromNote = async (
    noteId: string,
    contentType: "flashcards" | "questions",
  ) => {
    try {
      setIsGenerating(true);
      setStep("generating");
      setProcessingMessage(
        contentType === "flashcards"
          ? tModal("creatingFlashcards")
          : tModal("creatingQuestions"),
      );
      setGenerationProgress(30);

      const result = await generateFromNote(noteId, contentType, {
        cardCount,
        language: outputLanguage,
      });

      setGenerationProgress(100);

      if (result && result.success) {
        const generated: GeneratedContent = {
          type: contentType,
          title: result.noteTitle || "Generated Content",
          content: result.content,
          metadata: {
            ageGroup: result.ageGroup as AgeGroup,
            language: result.language,
            subject: result.noteSubject,
            generatedAt: new Date(),
          },
        };

        setGeneratedContent(generated);
        setStep("preview");
        toast({
          title: tModal("success"),
          description:
            contentType === "flashcards"
              ? tModal("flashcardsCreated")
              : tModal("questionCardsCreated"),
        });
      }
    } catch (error) {
      toast({
        title: tModal("error"),
        description: tModal("contentCreationError"),
        variant: "destructive",
      });
      setStep("configure");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case "upload":
        return 1;
      case "configure":
        return 2;
      case "generating":
        return 3;
      case "preview":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {t("step")} {getStepNumber()} / 4
            </span>
            <span>{t(`steps.${step}`)}</span>
          </div>
          <Progress value={(getStepNumber() / 4) * 100} />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {step === "upload" && (
            <div className="space-y-4">
              {/* Study Notes Sidebar */}
              <div className="flex justify-center pb-4">
                <StudyNotesSidebar
                  onSelectNote={handleSelectNote}
                  onGenerateFromNote={handleGenerateFromNote}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {tModal("orUploadNew")}
                  </span>
                </div>
              </div>

              <DocumentUploader onDocumentParsed={handleDocumentParsed} />
            </div>
          )}

          {step === "configure" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">{t("selectContentType")}</h3>
                <ContentTypeSelector
                  selected={contentType}
                  onSelect={setContentType}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4">{t("selectSettings")}</h3>
                <div className="space-y-4">
                  <AgeGroupSelector
                    selected={ageGroup}
                    onSelect={setAgeGroup}
                  />

                  <OutputLanguageSelector
                    selected={outputLanguage}
                    onSelect={setOutputLanguage}
                  />

                  {contentType && (
                    <CardCountSelector
                      selected={cardCount}
                      onSelect={setCardCount}
                      contentType={contentType}
                    />
                  )}

                  <div className="space-y-2">
                    <Label>
                      {t("subject")} ({t("optional")})
                    </Label>
                    <Input
                      placeholder={t("subjectPlaceholder")}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t("back")}
                </Button>
                <Button
                  onClick={handleGenerateContent}
                  disabled={!contentType || !ageGroup}
                >
                  {t("generate")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="font-semibold text-lg">{t("generating")}</h3>
              <p className="text-sm text-muted-foreground">
                {processingMessage || t("pleaseWait")}
              </p>
              <Progress
                value={generationProgress}
                className="w-full max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                {generationProgress}%
              </p>
            </div>
          )}

          {step === "preview" && generatedContent && (
            <div className="space-y-6">
              <AIGeneratedPreview content={generatedContent} />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("configure")}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t("regenerate")}
                </Button>
                <Button onClick={handleUseContent}>
                  {t("useContent")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
