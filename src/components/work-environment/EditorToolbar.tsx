/**
 * Editor Toolbar Component
 * Toolbar UI with all buttons and dialogs for the Rich Note Editor
 */

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  History,
  FolderOpen,
  FolderPlus,
  Link as LinkIcon,
  Search,
  Download,
  FileDown,
  Camera,
  Upload,
  Save,
  Columns,
  Play,
} from "lucide-react";
import type { BlockNoteEditor } from "@blocknote/core";
import { VideoType } from "@/types/richNoteEditor";

interface EditorToolbarProps {
  // Translation function
  t: any;

  // Save status
  isSaving: boolean;
  lastSaved: Date | null;
  onManualSave: () => void;

  // Version history
  showVersionHistory: boolean;
  setShowVersionHistory: (show: boolean) => void;

  // Split view
  splitView: boolean;
  setSplitView: (view: boolean) => void;
  onMergeRightContent: () => void;

  // Media handler props
  showVideoDialog: boolean;
  setShowVideoDialog: (show: boolean) => void;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  videoType: VideoType;
  setVideoType: (type: VideoType) => void;
  videoFile: File | null;
  setVideoFile: (file: File | null) => void;
  getYouTubeVideoId: (url: string) => string | null;
  getSpotifyEmbedUrl: (url: string) => string | null;
  onCreateVideoCard: () => void;

  // Organization props
  showOrganization: boolean;
  setShowOrganization: (show: boolean) => void;
  folders: any[];
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  selectedFolder: string;
  setSelectedFolder: (id: string) => void;
  onCreateFolder: () => void;
  onMoveToFolder: (folderId: string) => void;

  // Cross reference props
  showCrossReference: boolean;
  setShowCrossReference: (show: boolean) => void;
  crossReferences: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Export props
  showExport: boolean;
  setShowExport: (show: boolean) => void;
  onExportToPDF: () => void;
  onExportToMarkdown: () => void;

  // OCR props
  showOCR: boolean;
  setShowOCR: (show: boolean) => void;
  ocrProcessing: boolean;
  ocrResult: string;
  setOcrResult: (result: string) => void;
  ocrLanguage: string;
  setOcrLanguage: (lang: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onOCRUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInsertOCRText: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const {
    t,
    isSaving,
    lastSaved,
    onManualSave,
    showVersionHistory,
    setShowVersionHistory,
    splitView,
    setSplitView,
    onMergeRightContent,
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
    getYouTubeVideoId,
    getSpotifyEmbedUrl,
    onCreateVideoCard,
    showOrganization,
    setShowOrganization,
    folders,
    newFolderName,
    setNewFolderName,
    selectedFolder,
    setSelectedFolder,
    onCreateFolder,
    onMoveToFolder,
    showCrossReference,
    setShowCrossReference,
    crossReferences,
    searchQuery,
    setSearchQuery,
    showExport,
    setShowExport,
    onExportToPDF,
    onExportToMarkdown,
    showOCR,
    setShowOCR,
    ocrProcessing,
    ocrResult,
    setOcrResult,
    ocrLanguage,
    setOcrLanguage,
    fileInputRef,
    onOCRUpload,
    onInsertOCRText,
  } = props;

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        <h3 className="font-semibold">{t("title")}</h3>
        {lastSaved && (
          <Badge variant="secondary" className="text-xs">
            {isSaving
              ? t("saving")
              : t("lastSaved", { time: lastSaved.toLocaleTimeString() })}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Version History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowVersionHistory(!showVersionHistory)}
        >
          <History className="w-4 h-4" />
        </Button>

        {/* Split View Toggle */}
        <Button
          variant={splitView ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            if (splitView) {
              onMergeRightContent();
            }
            setSplitView(!splitView);
          }}
          title={splitView ? "Disable split view" : "Enable split view"}
        >
          <Columns className="w-4 h-4" />
        </Button>

        {/* Video Insertion */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowVideoDialog(true)}
          title="Video Ekle (YouTube, URL veya Dosya)"
        >
          <Play className="w-4 h-4" />
        </Button>

        {/* Organization */}
        <Dialog open={showOrganization} onOpenChange={setShowOrganization}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <FolderOpen className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("organization.organizeNotes")}</DialogTitle>
              <DialogDescription>
                {t("organization.createFolder")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("organization.folderName")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button onClick={onCreateFolder}>
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{t("organization.moveToFolder")}</Label>
                <Select
                  value={selectedFolder}
                  onValueChange={setSelectedFolder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onMoveToFolder(selectedFolder)}>
                {t("organization.moveToFolder")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cross References */}
        <Dialog open={showCrossReference} onOpenChange={setShowCrossReference}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <LinkIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("crossReference.title")}</DialogTitle>
              <DialogDescription>
                {t("crossReference.createLink")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("crossReference.searchNotes")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{t("crossReference.linkedNotes")}</Label>
                {crossReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{ref.label}</span>
                    <Button variant="ghost" size="sm">
                      {t("crossReference.removeLink")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export */}
        <DropdownMenu open={showExport} onOpenChange={setShowExport}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{t("export")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportToPDF}>
              <FileDown className="w-4 h-4 mr-2" />
              {t("exportOptions.pdf")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportToMarkdown}>
              <FileDown className="w-4 h-4 mr-2" />
              {t("exportOptions.markdown")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* OCR */}
        <Dialog open={showOCR} onOpenChange={setShowOCR}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Camera className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("ocr.title")}</DialogTitle>
              <DialogDescription>{t("ocr.supportedFormats")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("ocr.language")}</Label>
                <Select value={ocrLanguage} onValueChange={setOcrLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tur+eng">
                      {t("ocr.languageOptions.turkishEnglish")}
                    </SelectItem>
                    <SelectItem value="tur">
                      {t("ocr.languageOptions.turkishOnly")}
                    </SelectItem>
                    <SelectItem value="eng">
                      {t("ocr.languageOptions.englishOnly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onOCRUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("ocr.uploadImage")}
                </Button>
              </div>
              {ocrProcessing && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">{t("ocr.processing")}</p>
                </div>
              )}
              {ocrResult && (
                <div className="space-y-2">
                  <Label>Recognized Text:</Label>
                  <Textarea
                    value={ocrResult}
                    onChange={(e) => setOcrResult(e.target.value)}
                    rows={6}
                  />
                  <Button onClick={onInsertOCRText}>
                    {t("ocr.recognizeText")}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Video Dialog */}
        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Medya Ekle</DialogTitle>
              <DialogDescription>
                YouTube URL, Spotify link, direkt video URL veya yerel dosya
                yükleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Medya Tipi</Label>
                <Select
                  value={videoType}
                  onValueChange={(value: VideoType) => setVideoType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="direct">Direkt URL</SelectItem>
                    <SelectItem value="file">Dosya Yükle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {videoType === "youtube" && (
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              {videoType === "spotify" && (
                <div className="space-y-2">
                  <Label>Spotify URL</Label>
                  <Input
                    placeholder="https://open.spotify.com/track/... veya https://open.spotify.com/playlist/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              {videoType === "direct" && (
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              {videoType === "file" && (
                <div className="space-y-2">
                  <Label>Video Dosyası</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Video Başlığı (İsteğe bağlı)</Label>
                <Input
                  placeholder="Video başlığı..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              {/* Media Preview */}
              {videoUrl && videoType !== "file" && (
                <div className="space-y-2">
                  <Label>Önizleme</Label>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    {videoType === "youtube" ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl) || "dQw4w9WgXcQ"}?rel=0&modestbranding=1`}
                        className="w-full h-full rounded-md"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        title="YouTube Video Preview"
                      />
                    ) : videoType === "spotify" ? (
                      <iframe
                        src={
                          getSpotifyEmbedUrl(videoUrl) ||
                          "https://open.spotify.com/embed/playlist/2VLBh9qpGUB7a6hQxIdGtw"
                        }
                        className="w-full h-full rounded-md"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title="Spotify Preview"
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        className="w-full h-full rounded-md"
                        controls
                        preload="metadata"
                      />
                    )}
                  </div>
                </div>
              )}

              {videoFile && (
                <div className="space-y-2">
                  <Label>Dosya Önizlemesi</Label>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <video
                      src={URL.createObjectURL(videoFile)}
                      className="w-full h-full rounded-md"
                      controls
                      preload="metadata"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowVideoDialog(false)}
              >
                İptal
              </Button>
              <Button onClick={onCreateVideoCard}>Medya Kartı Oluştur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Save */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
