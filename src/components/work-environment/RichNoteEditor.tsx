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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Eye,
  EyeOff,
  Save,
  History,
  Undo,
  Redo,
  FileText,
  Calculator,
  Download,
  Upload,
  FolderPlus,
  FolderOpen,
  Link as LinkIcon,
  Search,
  FileDown,
  Camera,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
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
import mammoth from 'mammoth';

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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOrganization, setShowOrganization] = useState(false);
  const [showCrossReference, setShowCrossReference] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    if (content && content.trim() && content !== '[]') {
      setIsSaving(true);
      saveRichNoteVersion(cardId, content);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [content, cardId, saveRichNoteVersion]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

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

  // Handle content changes from BlockNote
  const handleContentChange = useCallback(() => {
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);
    setContent(jsonContent);
    
    // Auto-save the content to IndexedDB
    if (jsonContent && jsonContent !== '[]') {
      saveRichNoteVersion(cardId, jsonContent);
    }
  }, [editor, cardId, saveRichNoteVersion]);

  // OCR functionality
  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    try {
      const worker = await createWorker('eng');
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
      <div className="flex-1 overflow-hidden">
        <BlockNoteView
          editor={editor}
          onChange={handleContentChange}
          theme="light"
          className="h-full"
        />
      </div>

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