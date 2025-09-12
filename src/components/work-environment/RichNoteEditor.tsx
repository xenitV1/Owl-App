'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { useTranslations } from 'next-intl';
import { createWorker } from 'tesseract.js';
// import { PDFDocument, rgb } from '@react-pdf/renderer';
import TurndownService from 'turndown';
import MediaUploader, { type MediaKind, type SelectedMedia } from '@/components/media/MediaUploader';
import ImagePreview from '@/components/media/ImagePreview';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { generateVideoThumbnail, mp4ToMp3, blobToObjectUrl, revokeObjectUrl } from '@/lib/formatConverter';


interface RichNoteEditorProps {
  cardId: string;
  initialContent?: string;
  onClose?: () => void;
}

interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  children: NoteFolder[];
  notes: string[];
}

interface CrossReference {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  label: string;
}

export function RichNoteEditor({ cardId, initialContent = '', onClose }: RichNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [lastSaveAtMs, setLastSaveAtMs] = useState<number>(0);
  const MIN_SAVE_INTERVAL_MS = 30000; // 30s
  const DEBOUNCE_MS = 5000; // 5s idle debounce
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOrganization, setShowOrganization] = useState(false);
  const [showCrossReference, setShowCrossReference] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrLanguage, setOcrLanguage] = useState('tur+eng');
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInsertMedia, setShowInsertMedia] = useState<null | MediaKind>(null);
  const [pendingMedia, setPendingMedia] = useState<SelectedMedia | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [insertTarget, setInsertTarget] = useState<'left' | 'right'>('left');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('workEnvironment.richNote');

  const { saveRichNoteVersion, cards } = useWorkspaceStore();

  const card = cards.find(c => c.id === cardId);
  const richContent = card?.richContent;

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: undefined, // We'll set this in useEffect
  });
  const editorRight = useCreateBlockNote({
    initialContent: undefined,
  });

  // Load existing content when card data is available
  useEffect(() => {
    if (richContent?.markdown && editor.document.length === 1 && editor.document[0].type === 'paragraph' && !editor.document[0].content) {
      try {
        const parsedContent = JSON.parse(richContent.markdown);
        editor.replaceBlocks(editor.document, parsedContent);
        setContent(richContent.markdown);
      } catch (error) {
        console.error('Error parsing rich content:', error);
      }
    }
  }, [richContent?.markdown, editor]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    const now = Date.now();
    const hasContent = content && content.trim() && content !== '[]';
    const changed = content !== lastSavedContent;
    const dueByInterval = now - lastSaveAtMs >= MIN_SAVE_INTERVAL_MS;

    if (hasContent && changed && dueByInterval) {
      setIsSaving(true);
      saveRichNoteVersion(cardId, content);
      setLastSaved(new Date());
      setLastSavedContent(content);
      setLastSaveAtMs(now);
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [content, cardId, saveRichNoteVersion, lastSavedContent, lastSaveAtMs]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, DEBOUNCE_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, autoSave]);

  // Handle keyboard events specifically for the editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event is coming from our editor
      const target = e.target as HTMLElement;
      const isInOurEditor = target.closest('[data-workspace-card="true"]') && 
                           target.closest('.ProseMirror');
      
      if (isInOurEditor) {
        // Stop propagation for space key to prevent pan mode activation
        if (e.key === ' ') {
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Handle content changes from BlockNote (no immediate save; debounced via autoSave effect)
  const handleContentChange = useCallback(() => {
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);
    setContent(jsonContent);
  }, [editor]);

  const handleContentChangeRight = useCallback(() => {
    // Right editor currently not persisted; hook kept for future state sync
  }, [editorRight]);

  // OCR functionality
  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    try {
      // Use selected language for OCR recognition
      const worker = await createWorker(ocrLanguage);
      const { data: { text } } = await worker.recognize(file);
      setOcrResult(text);
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrResult(t('ocr.noTextFound'));
    } finally {
      setOcrProcessing(false);
    }
  };

  const insertOCRText = () => {
    if (ocrResult) {
      editor.insertBlocks([
        {
          type: 'paragraph',
          content: ocrResult,
        },
      ], editor.getTextCursorPosition().block, 'after');
      setOcrResult('');
    }
  };

  const insertImageBlock = useCallback((media: SelectedMedia, target: 'left' | 'right' = 'left') => {
    const instance = target === 'left' ? editor : editorRight;
    const src = media.previewUrl || media.url;
    if (!src) return;
    instance.insertBlocks([
      {
        type: 'image',
        props: { url: src, alt: media.alt || '' },
      } as any,
    ], instance.getTextCursorPosition().block, 'after');
  }, [editor, editorRight]);

  const insertVideoBlock = useCallback(async (media: SelectedMedia, target: 'left' | 'right' = 'left') => {
    console.debug('[RichNote] insertVideoBlock start', { target, hasFile: !!media.file, url: media.url, previewUrl: media.previewUrl });
    const instance = target === 'left' ? editor : editorRight;
    let src = media.previewUrl || media.url;
    if (!src && media.file) src = URL.createObjectURL(media.file);
    if (!src) {
      console.warn('[RichNote] insertVideoBlock no src');
      return;
    }
    let thumb: string | undefined;
    try {
      if (media.file) {
        console.debug('[RichNote] generate video thumbnail...');
        const blob = await generateVideoThumbnail(media.file, 1);
        thumb = blobToObjectUrl(blob);
        setThumbUrl(thumb);
        console.debug('[RichNote] thumbnail generated', { thumb });
      }
    } catch (err) {
      console.error('[RichNote] thumbnail generation failed', err);
    }
    instance.insertBlocks([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '' }],
      } as any,
    ], instance.getTextCursorPosition().block, 'after');
    instance.insertBlocks([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: src }],
      } as any,
    ], instance.getTextCursorPosition().block, 'after');
    if (media.file && !media.previewUrl && src.startsWith('blob:')) {
      try { URL.revokeObjectURL(src); } catch {}
    }
    console.debug('[RichNote] insertVideoBlock done', { src, target });
  }, [editor, editorRight]);

  const insertAudioBlock = useCallback(async (media: SelectedMedia, target: 'left' | 'right' = 'left') => {
    console.debug('[RichNote] insertAudioBlock start', { target, hasFile: !!media.file, url: media.url, previewUrl: media.previewUrl });
    const instance = target === 'left' ? editor : editorRight;
    let src = media.previewUrl || media.url;
    if (!src && media.file) src = URL.createObjectURL(media.file);
    if (!src) {
      console.warn('[RichNote] insertAudioBlock no src');
      return;
    }
    instance.insertBlocks([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: src }],
      } as any,
    ], instance.getTextCursorPosition().block, 'after');
    if (media.file && !media.previewUrl && src.startsWith('blob:')) {
      try { URL.revokeObjectURL(src); } catch {}
    }
    console.debug('[RichNote] insertAudioBlock done', { src, target });
  }, [editor, editorRight]);

  const handleMediaSelect = useCallback(async (media: SelectedMedia) => {
    console.debug('[RichNote] handleMediaSelect', media);
    setPendingMedia(media);

    const target = insertTarget;

    if (media.kind === 'image') {
      insertImageBlock(media, target);
      if (media.previewUrl && media.previewUrl.startsWith('blob:')) revokeObjectUrl(media.previewUrl);
      setShowInsertMedia(null);
      setPendingMedia(null);
      return;
    }
    if (media.kind === 'video') {
      await insertVideoBlock(media, target);
      if (media.previewUrl && media.previewUrl.startsWith('blob:')) revokeObjectUrl(media.previewUrl);
      setShowInsertMedia(null);
      setPendingMedia(null);
      return;
    }
    if (media.kind === 'audio') {
      if (media.file && media.file.type === 'video/mp4') {
        try {
          console.debug('[RichNote] MP4->MP3 conversion start');
          setIsConverting(true);
          const mp3Blob = await mp4ToMp3(media.file);
          const mp3Url = blobToObjectUrl(mp3Blob);
          console.debug('[RichNote] MP3 produced', { mp3Url });
          await insertAudioBlock({ kind: 'audio', url: mp3Url }, target);
          if (mp3Url.startsWith('blob:')) revokeObjectUrl(mp3Url);
        } catch (e) {
          console.error('[RichNote] MP4->MP3 conversion failed', e);
          await insertAudioBlock(media, target);
        } finally {
          setIsConverting(false);
          console.debug('[RichNote] MP4->MP3 conversion end');
        }
      } else {
        await insertAudioBlock(media, target);
      }
      if (media.previewUrl && media.previewUrl.startsWith('blob:')) revokeObjectUrl(media.previewUrl);
      setShowInsertMedia(null);
      setPendingMedia(null);
      return;
    }
  }, [insertImageBlock, insertVideoBlock, insertAudioBlock, insertTarget]);

  // Revoke thumbnail object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (thumbUrl && thumbUrl.startsWith('blob:')) {
        try { revokeObjectUrl(thumbUrl); } catch {}
      }
    };
  }, [thumbUrl]);

  // Export functionality
  const exportToPDF = async () => {
    try {
      const blocks = editor.document;
      const text = blocks.map(block => {
        if (block.type === 'paragraph') {
          return block.content?.map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'text' in item) {
              return (item as any).text || '';
            }
            return '';
          }).join('') + '\n';
        }
        return '';
      }).join('');

      // Simple PDF generation - in production, use react-pdf
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${cardId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Error:', error);
    }
  };

  const exportToMarkdown = () => {
    try {
      const blocks = editor.document;
      const turndownService = new TurndownService();
      const html = blocks.map(block => {
        if (block.type === 'paragraph') {
          return `<p>${block.content?.map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'text' in item) {
              return (item as any).text || '';
            }
            return '';
          }).join('')}</p>`;
        }
        return '';
      }).join('');
      
      const markdown = turndownService.turndown(html);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${cardId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Error:', error);
    }
  };

  // Folder management
  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: NoteFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        children: [],
        notes: [],
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
    }
  };

  const moveToFolder = (folderId: string) => {
    // Implementation for moving note to folder
    console.log('Moving to folder:', folderId);
  };

  // Cross-reference management
  const createCrossReference = (targetNoteId: string, label: string) => {
    const newRef: CrossReference = {
      id: Date.now().toString(),
      sourceNoteId: cardId,
      targetNoteId,
      label,
    };
    setCrossReferences([...crossReferences, newRef]);
  };

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="font-semibold">{t('title')}</h3>
          {lastSaved && (
            <Badge variant="secondary" className="text-xs">
              {isSaving ? t('saving') : t('lastSaved', { time: lastSaved.toLocaleTimeString() })}
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
            variant={splitView ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSplitView((v) => !v)}
            title={splitView ? 'Disable split view' : 'Enable split view'}
          >
            <Columns className="w-4 h-4" />
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
                <DialogTitle>{t('organization.organizeNotes')}</DialogTitle>
                <DialogDescription>
                  {t('organization.createFolder')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('organization.folderName')}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={createFolder}>
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>{t('organization.moveToFolder')}</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
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
                <Button onClick={() => moveToFolder(selectedFolder)}>
                  {t('organization.moveToFolder')}
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
                <DialogTitle>{t('crossReference.title')}</DialogTitle>
                <DialogDescription>
                  {t('crossReference.createLink')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('crossReference.searchNotes')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>{t('crossReference.linkedNotes')}</Label>
                  {crossReferences.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{ref.label}</span>
                      <Button variant="ghost" size="sm">
                        {t('crossReference.removeLink')}
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
              <DropdownMenuLabel>{t('export')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                {t('exportOptions.pdf')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToMarkdown}>
                <FileDown className="w-4 h-4 mr-2" />
                {t('exportOptions.markdown')}
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
                <DialogTitle>{t('ocr.title')}</DialogTitle>
                <DialogDescription>
                  {t('ocr.supportedFormats')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('ocr.language')}</Label>
                  <Select value={ocrLanguage} onValueChange={setOcrLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tur+eng">{t('ocr.languageOptions.turkishEnglish')}</SelectItem>
                      <SelectItem value="tur">{t('ocr.languageOptions.turkishOnly')}</SelectItem>
                      <SelectItem value="eng">{t('ocr.languageOptions.englishOnly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleOCRUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('ocr.uploadImage')}
                  </Button>
                </div>
                {ocrProcessing && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2">{t('ocr.processing')}</p>
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
                    <Button onClick={insertOCRText}>
                      {t('ocr.recognizeText')}
          </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Insert Media */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Upload className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {/* When split view is on, allow choosing the target pane */}
              {splitView && (
                <>
                  <DropdownMenuLabel>Insert target</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setInsertTarget('left')}>Left (Editor)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInsertTarget('right')}>Right (Editor)</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setShowInsertMedia('image')}>Insert Image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowInsertMedia('video')}>Insert Video</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowInsertMedia('audio')}>Insert Audio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Manual Save */}
          <Button
            variant="ghost"
            size="sm"
            onClick={autoSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {!splitView && (
          <BlockNoteView
            editor={editor}
            onChange={handleContentChange}
            theme="light"
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
                theme="light"
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
                theme="light"
                className="h-full"
                formattingToolbar
                sideMenu
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Dialog */}
      <Dialog open={!!showInsertMedia} onOpenChange={() => { setShowInsertMedia(null); if (pendingMedia?.previewUrl && pendingMedia.previewUrl.startsWith('blob:')) revokeObjectUrl(pendingMedia.previewUrl); setPendingMedia(null); if (thumbUrl && thumbUrl.startsWith('blob:')) revokeObjectUrl(thumbUrl); setThumbUrl(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insert {showInsertMedia}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showInsertMedia && (
              <MediaUploader accept={[showInsertMedia]} onSelect={handleMediaSelect} />
            )}
            {pendingMedia?.kind === 'image' && pendingMedia.previewUrl && (
              <ImagePreview src={pendingMedia.previewUrl} alt={pendingMedia.alt} />
            )}
            {pendingMedia?.kind === 'video' && (pendingMedia.previewUrl || pendingMedia.url) && (
              <VideoPlayer src={(pendingMedia.previewUrl || pendingMedia.url)!} thumbnailUrl={thumbUrl || undefined} />
            )}
            {pendingMedia?.kind === 'audio' && (pendingMedia.previewUrl || pendingMedia.url) && (
              <AudioPlayer src={(pendingMedia.previewUrl || pendingMedia.url)!} />
            )}
            {isConverting && <div className="text-sm">Converting to MP3...</div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History */}
      {showVersionHistory && richContent?.versionHistory && (
        <div className="border-t p-4 max-h-48 overflow-y-auto">
          <h4 className="font-medium mb-2">{t('versionHistory')}</h4>
          <div className="space-y-2">
            {richContent.versionHistory.slice(-5).reverse().map((version: any, index: number) => (
              <div key={index} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
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
    </Card>
  );
}