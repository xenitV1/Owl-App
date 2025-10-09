"use client";

import { Card } from "@/components/ui/card";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslations } from "next-intl";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { useRichNoteEditor } from "@/hooks/useRichNoteEditor";
import { useNoteExporter } from "@/hooks/useNoteExporter";
import { useOCRProcessor } from "@/hooks/useOCRProcessor";
import { useMediaHandler } from "@/hooks/useMediaHandler";
import { useNoteOrganization } from "@/hooks/useNoteOrganization";
import { EditorToolbar } from "./EditorToolbar";
import { calculateConnectionPath } from "@/utils/mediaHelpers";
import { RichNoteEditorProps } from "@/types/richNoteEditor";

export function RichNoteEditor({
  cardId,
  initialContent = "",
  onClose,
}: RichNoteEditorProps) {
  const t = useTranslations("workEnvironment.richNote");
  const { resolvedTheme } = useTheme();
  const { cards, addCard } = useWorkspaceStore();

  // Core editor hook
  const {
    editor,
    editorRight,
    content,
    rightContent,
    splitView,
    setSplitView,
    isSaving,
    lastSaved,
    showVersionHistory,
    setShowVersionHistory,
    handleContentChange,
    handleContentChangeRight,
    mergeRightContentIntoLeft,
    autoSave,
    richContent,
  } = useRichNoteEditor({ cardId, initialContent });

  // Export functionality
  const { showExport, setShowExport, exportToPDF, exportToMarkdown } =
    useNoteExporter(cardId);

  // OCR functionality
  const {
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
  } = useOCRProcessor(t);

  // Media handler
  const {
    showVideoDialog,
    setShowVideoDialog,
    videoUrl,
    setVideoUrl,
    videoTitle,
    setVideoTitle,
    videoType,
    setVideoType,
    videoFile,
    setVideoFile,
    connections,
    handleCreateVideoCard,
    getYouTubeVideoId,
    getSpotifyEmbedUrl,
  } = useMediaHandler({ cardId, cards, addCard });

  // Organization
  const {
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
  } = useNoteOrganization(cardId);

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm">
      {/* Toolbar */}
      <EditorToolbar
        t={t}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onManualSave={autoSave}
        showVersionHistory={showVersionHistory}
        setShowVersionHistory={setShowVersionHistory}
        splitView={splitView}
        setSplitView={setSplitView}
        onMergeRightContent={mergeRightContentIntoLeft}
        showVideoDialog={showVideoDialog}
        setShowVideoDialog={setShowVideoDialog}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        videoTitle={videoTitle}
        setVideoTitle={setVideoTitle}
        videoType={videoType}
        setVideoType={setVideoType}
        videoFile={videoFile}
        setVideoFile={setVideoFile}
        getYouTubeVideoId={getYouTubeVideoId}
        getSpotifyEmbedUrl={getSpotifyEmbedUrl}
        onCreateVideoCard={handleCreateVideoCard}
        showOrganization={showOrganization}
        setShowOrganization={setShowOrganization}
        folders={folders}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
        onCreateFolder={createFolder}
        onMoveToFolder={moveToFolder}
        showCrossReference={showCrossReference}
        setShowCrossReference={setShowCrossReference}
        crossReferences={crossReferences}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showExport={showExport}
        setShowExport={setShowExport}
        onExportToPDF={() => exportToPDF(editor as any)}
        onExportToMarkdown={() => exportToMarkdown(editor as any)}
        showOCR={showOCR}
        setShowOCR={setShowOCR}
        ocrProcessing={ocrProcessing}
        ocrResult={ocrResult}
        setOcrResult={setOcrResult}
        ocrLanguage={ocrLanguage}
        setOcrLanguage={setOcrLanguage}
        fileInputRef={fileInputRef as any}
        onOCRUpload={handleOCRUpload}
        onInsertOCRText={() => insertOCRText(editor as any)}
      />

      {/* Editor Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {!splitView && (
          <BlockNoteView
            editor={editor}
            onChange={handleContentChange}
            theme={resolvedTheme as any}
            className="h-full"
            formattingToolbar
            sideMenu
          />
        )}
        {splitView && (
          <div className="h-full flex min-h-0">
            <div className="flex-1 min-h-0 overflow-auto border-r">
              <BlockNoteView
                editor={editor}
                onChange={handleContentChange}
                theme={resolvedTheme as any}
                className="h-full"
                formattingToolbar
                sideMenu
              />
            </div>
            <div className="w-1 bg-border" />
            <div className="flex-1 min-h-0 overflow-auto">
              <BlockNoteView
                editor={editorRight}
                onChange={handleContentChangeRight}
                theme={resolvedTheme as any}
                className="h-full"
                formattingToolbar
                sideMenu
              />
            </div>
          </div>
        )}
      </div>

      {/* Version History */}
      {showVersionHistory && richContent?.versionHistory && (
        <div className="border-t p-4 max-h-48 overflow-y-auto">
          <h4 className="font-medium mb-2">{t("versionHistory")}</h4>
          <div className="space-y-2">
            {richContent.versionHistory
              .slice(-5)
              .reverse()
              .map((version: any, index: number) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground p-2 bg-muted/50 rounded"
                >
                  <div className="font-medium">
                    {new Date(version.timestamp).toLocaleString()}
                  </div>
                  <div className="truncate">
                    {version.content.substring(0, 100)}...
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Connection Visualization */}
      {connections.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map((connection) => (
            <g key={connection.id}>
              <path
                d={calculateConnectionPath(connection)}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                filter="url(#glow)"
                className="animate-pulse"
                opacity="0.7"
              />
              <circle
                cx={connection.sourcePosition.x + connection.sourceSize.width}
                cy={
                  connection.sourcePosition.y + connection.sourceSize.height / 2
                }
                r="4"
                fill="hsl(var(--primary))"
                className="animate-pulse"
              />
              <circle
                cx={connection.targetPosition.x}
                cy={
                  connection.targetPosition.y + connection.targetSize.height / 2
                }
                r="4"
                fill="hsl(var(--primary))"
                className="animate-pulse"
              />
            </g>
          ))}
        </svg>
      )}
    </Card>
  );
}
