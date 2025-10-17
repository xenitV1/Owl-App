"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  X,
  Loader2,
  FileCheck,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isPDFFile,
  getEstimatedProcessingTime,
} from "@/lib/ai/pdfProcessorClient";
import { processPDFWithUnpdf } from "@/lib/ai/pdfProcessorClientUnpdf";
import { clearPDFCache, getCacheInfo } from "@/lib/ai/pdfCache";
import type { PDFProcessingProgress, PDFProcessingResult } from "@/types/ai";
import type { AppCreateStudyNoteRequest as CreateStudyNoteRequest } from "@/types/studyNote";
import { OCR_LANGUAGES, buildLanguageCode } from "@/lib/ai/ocrLanguages";

interface DocumentUploaderProps {
  onDocumentParsed: (text: string, filename: string) => void;
  onError?: (error: string) => void;
}

export function DocumentUploader({
  onDocumentParsed,
  onError,
}: DocumentUploaderProps) {
  const t = useTranslations("ai");
  const tDoc = useTranslations("documentUploader");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PDFProcessingProgress | null>(null);
  const [processingResult, setProcessingResult] =
    useState<PDFProcessingResult | null>(null);
  const [enableOCR, setEnableOCR] = useState<boolean>(true);
  const [ocrSelectedCodes, setOcrSelectedCodes] = useState<string[]>(["eng"]);
  const [showPreview, setShowPreview] = useState(false);
  const [saveAsStudyNote, setSaveAsStudyNote] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteAgeGroup, setNoteAgeGroup] = useState<
    "elementary" | "middle" | "high" | "university"
  >("university");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // NO FILE SIZE LIMIT - User requested unlimited size
    // Only show warning for very large files
    if (file.size > 100 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(0);
      const estimatedTime = getEstimatedProcessingTime(file.size);

      toast({
        title: tDoc("largeFileWarning"),
        description: tDoc("largeFileDescription", { sizeMB, estimatedTime }),
        variant: "default",
      });
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    const isValidType = validTypes.some((type) =>
      file.type.toLowerCase().includes(type.toLowerCase()),
    );

    if (!isValidType) {
      toast({
        title: t("error"),
        description: t("invalidFileType"),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setProcessingResult(null);
    setProgress(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(null);

    try {
      // Check if it's a PDF - if yes, process client-side
      if (isPDFFile(selectedFile)) {
        // Use unpdf directly (better Next.js 15 compatibility)
        const result = await processPDFWithUnpdf(selectedFile, {
          convertToMarkdown: true,
          preserveFormatting: true,
          optimizeSize: true,
          enableOCR,
          ocrLanguages: buildLanguageCode(ocrSelectedCodes),
          onProgress: (progressUpdate) => {
            setProgress(progressUpdate);
          },
        });

        if (result.success) {
          setProcessingResult(result);
          // Auto save as study note if enabled
          if (saveAsStudyNote) {
            const payload: CreateStudyNoteRequest = {
              title: noteTitle || selectedFile.name.replace(/\.[^/.]+$/, ""),
              content: result.content,
              ageGroup: noteAgeGroup,
              language: "tr",
              sourceDocument: selectedFile.name,
            };

            try {
              await fetch("/api/study-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
            } catch (e) {
              console.error("Failed to save study note", e);
            }
          }

          const sizeMB = (result.originalSize / (1024 * 1024)).toFixed(1);
          const processedMB = (result.processedSize / (1024 * 1024)).toFixed(1);

          toast({
            title: tDoc("processingCompleted"),
            description: tDoc("processingDescription", {
              totalPages: result.metadata.totalPages,
              sizeMB,
              processedMB,
              compressionRatio: result.compressionRatio.toFixed(0),
            }),
          });
        } else {
          throw new Error(result.error || "PDF processing failed");
        }
      } else {
        // Fallback to server-side for non-PDF files
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/ai/parse-document", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to parse document");
        }

        toast({
          title: t("success"),
          description: t("documentParsed"),
        });

        onDocumentParsed(data.data.text, data.data.filename);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Processing failed";
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseProcessedContent = async () => {
    if (processingResult && processingResult.success) {
      setProgress({
        stage: "complete",
        currentPage: processingResult.metadata.totalPages,
        totalPages: processingResult.metadata.totalPages,
        percentage: 100,
        message: "AI'a gönderiliyor...",
      });

      // Simulate a brief delay to show the message
      await new Promise((resolve) => setTimeout(resolve, 500));

      onDocumentParsed(
        processingResult.content,
        processingResult.metadata.fileName,
      );
      setShowPreview(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProcessingResult(null);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />

      {!selectedFile ? (
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{t("uploadDocument")}</p>
            <p className="text-sm text-muted-foreground text-center">
              {t("supportedFormats")}: PDF, DOCX, TXT
            </p>
            <p className="text-xs text-success mt-1">
              {tDoc("noFileSizeLimit")}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{tDoc("processedFilesCached")}</span>
              <button
                onClick={() => {
                  clearPDFCache();
                  toast({
                    title: tDoc("cacheCleared"),
                    description: tDoc("cacheClearedDescription"),
                  });
                }}
                className="text-primary hover:underline"
              >
                {tDoc("clearCache")}
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {processingResult?.success ? (
                  <FileCheck className="h-8 w-8 text-green-500" />
                ) : progress?.stage === "error" ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <FileText className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {processingResult?.success && (
                    <p className="text-xs text-green-600">
                      ✓ {processingResult.metadata.totalPages} sayfa • %
                      {processingResult.compressionRatio.toFixed(0)} azaltma
                      {processingResult.processingTime < 1000 &&
                        tDoc("fromCache")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isProcessing && !processingResult && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                {processingResult?.success && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {tDoc("preview")}
                  </Button>
                )}

                {!processingResult && (
                  <Button onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tDoc("processing")}
                      </>
                    ) : (
                      tDoc("process")
                    )}
                  </Button>
                )}

                {processingResult?.success && (
                  <Button onClick={handleUseProcessedContent}>
                    {tDoc("sendToAI")}
                  </Button>
                )}
              </div>
            </div>

            {/* OCR Options */}
            {!processingResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enableOCR}
                    onChange={(e) => setEnableOCR(e.target.checked)}
                  />
                  <span>{tDoc("ocrFallback")}</span>
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span>{tDoc("ocrLanguages")}</span>
                  <select
                    multiple
                    value={ocrSelectedCodes}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      );
                      setOcrSelectedCodes(options);
                    }}
                    className="px-2 py-1 border rounded min-w-48 h-24"
                  >
                    {OCR_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Save as Study Note Options */}
            {!processingResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveAsStudyNote}
                    onChange={(e) => setSaveAsStudyNote(e.target.checked)}
                  />
                  <span>{tDoc("saveAsStudyNote")}</span>
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span>{tDoc("noteTitle")}</span>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="px-2 py-1 border rounded w-48"
                    placeholder={tDoc("noteTitlePlaceholder")}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{tDoc("noteLevel")}</span>
                  <select
                    value={noteAgeGroup}
                    onChange={(e) => setNoteAgeGroup(e.target.value as any)}
                    className="px-2 py-1 border rounded w-48"
                  >
                    <option value="elementary">
                      {t("ageGroups.elementary")}
                    </option>
                    <option value="middle">{t("ageGroups.middle")}</option>
                    <option value="high">{t("ageGroups.high")}</option>
                    <option value="university">
                      {t("ageGroups.university")}
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isProcessing && progress && (
              <div className="space-y-2">
                <Progress value={progress.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.message}
                  </span>
                  <span className="text-muted-foreground">
                    {progress.currentPage}/{progress.totalPages} •{" "}
                    {progress.percentage}%
                    {progress.estimatedTimeRemaining &&
                      ` • ~${progress.estimatedTimeRemaining}s`}
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {progress?.stage === "error" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{progress.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{tDoc("processedContentPreview")}</DialogTitle>
            <DialogDescription>
              {processingResult?.metadata.format === "markdown"
                ? tDoc("markdownFormat")
                : tDoc("plainTextFormat")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-md p-4 max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {processingResult?.content.substring(0, 5000)}
                {processingResult &&
                  processingResult.content.length > 5000 &&
                  `\n\n${tDoc("contentContinues")}`}
              </pre>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>
                  {tDoc("totalCharacters", {
                    count:
                      processingResult?.content.length.toLocaleString() || 0,
                  })}
                </p>
                <p>
                  {tDoc("processingTime", {
                    time: (
                      (processingResult?.processingTime || 0) / 1000
                    ).toFixed(1),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  {tDoc("close")}
                </Button>
                <Button onClick={handleUseProcessedContent}>
                  {tDoc("sendToAI")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
