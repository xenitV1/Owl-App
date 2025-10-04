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
  Play,
} from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import { createWorker } from 'tesseract.js';
// import { PDFDocument, rgb } from '@react-pdf/renderer';
import TurndownService from 'turndown';
import { blobUrlToDataUrl } from '@/lib/formatConverter';


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

interface CardConnection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  sourceSize: { width: number; height: number };
  targetSize: { width: number; height: number };
}


export function RichNoteEditor({ cardId, initialContent = '', onClose }: RichNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [rightContent, setRightContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [lastSavedRightContent, setLastSavedRightContent] = useState<string>('');
  const [lastSaveAtMs, setLastSaveAtMs] = useState<number>(0);
  const MIN_SAVE_INTERVAL_MS = 30000; // 30s
  const DEBOUNCE_MS = 5000; // 5s idle debounce
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOrganization, setShowOrganization] = useState(false);
  const [showCrossReference, setShowCrossReference] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrLanguage, setOcrLanguage] = useState('tur+eng');
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [splitView, setSplitView] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'direct' | 'file' | 'spotify'>('youtube');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [connections, setConnections] = useState<CardConnection[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('workEnvironment.richNote');
  const { resolvedTheme } = useTheme();

  const { saveRichNoteVersion, cards, addCard } = useWorkspaceStore();

  const card = cards.find(c => c.id === cardId);
  const richContent = card?.richContent;

  // Initialize BlockNote editor with linkify disabled to prevent console warnings
  const editor = useCreateBlockNote({
    initialContent: undefined, // We'll set this in useEffect
    _tiptapOptions: {
      enableInputRules: true,
      enablePasteRules: true,
    },
  });
  const editorRight = useCreateBlockNote({
    initialContent: undefined,
    _tiptapOptions: {
      enableInputRules: true,
      enablePasteRules: true,
    },
  });

  // Load existing content when card data is available
  useEffect(() => {
    if (richContent?.markdown && Array.isArray(editor.document) && editor.document.length === 1 && editor.document[0].type === 'paragraph' && Array.isArray(editor.document[0].content) && editor.document[0].content.length === 0) {
      try {
        // Try to parse as new split view structure first
        let contentData;
        try {
          contentData = JSON.parse(richContent.markdown);
          
          // Check if it's the new split view structure
          if (contentData.leftContent !== undefined) {
            // Restore split view state
            setSplitView(contentData.splitView || false);
            
            // Load left content
            const leftBlocks = JSON.parse(contentData.leftContent);
            editor.replaceBlocks(editor.document, leftBlocks);
            setContent(contentData.leftContent);
            
            // Load right content if it exists
            if (contentData.rightContent && contentData.rightContent !== '[]') {
              const rightBlocks = JSON.parse(contentData.rightContent);
              editorRight.replaceBlocks(editorRight.document, rightBlocks);
              setRightContent(contentData.rightContent);
            }
          } else {
            // Fallback to old single editor structure
            editor.replaceBlocks(editor.document, contentData);
            setContent(richContent.markdown);
          }
        } catch (parseError) {
          // If parsing fails, treat as plain markdown text from AI
          try {
            const parsedContent = JSON.parse(richContent.markdown);
            editor.replaceBlocks(editor.document, parsedContent);
            setContent(richContent.markdown);
          } catch {
            // Not JSON, treat as plain markdown - convert manually to BlockNote blocks
            const markdownText = richContent.markdown;
            
            const blocks: any[] = [];
            const lines = markdownText.split('\n');
            let inCodeBlock = false;
            let codeContent: string[] = [];
            let codeLanguage = '';
            
            // Helper to parse inline styles (bold, italic, code, links)
            const parseInlineStyles = (text: string): any[] => {
              const parts: any[] = [];
              let currentIndex = 0;
              
              // Regex for: **bold**, *italic*, `code`, [link](url)
              const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
              let match;
              
              while ((match = regex.exec(text)) !== null) {
                // Add text before match
                if (match.index > currentIndex) {
                  parts.push({ 
                    type: 'text', 
                    text: text.slice(currentIndex, match.index), 
                    styles: {} 
                  });
                }
                
                const matched = match[0];
                
                // Bold **text**
                if (matched.startsWith('**') && matched.endsWith('**')) {
                  parts.push({ 
                    type: 'text', 
                    text: matched.slice(2, -2), 
                    styles: { bold: true } 
                  });
                }
                // Italic *text*
                else if (matched.startsWith('*') && matched.endsWith('*') && !matched.startsWith('**')) {
                  parts.push({ 
                    type: 'text', 
                    text: matched.slice(1, -1), 
                    styles: { italic: true } 
                  });
                }
                // Inline code `code`
                else if (matched.startsWith('`') && matched.endsWith('`')) {
                  parts.push({ 
                    type: 'text', 
                    text: matched.slice(1, -1), 
                    styles: { code: true } 
                  });
                }
                // Link [text](url)
                else if (match[2] && match[3]) {
                  parts.push({ 
                    type: 'link', 
                    content: [{ type: 'text', text: match[2], styles: {} }],
                    href: match[3]
                  });
                }
                
                currentIndex = match.index + matched.length;
              }
              
              // Add remaining text
              if (currentIndex < text.length) {
                parts.push({ 
                  type: 'text', 
                  text: text.slice(currentIndex), 
                  styles: {} 
                });
              }
              
              return parts.length > 0 ? parts : [{ type: 'text', text, styles: {} }];
            };
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              
              // Handle code blocks
              if (trimmed.startsWith('```')) {
                if (inCodeBlock) {
                  // End code block
                  blocks.push({
                    type: 'codeBlock',
                    props: { language: codeLanguage || 'plaintext' },
                    content: [{ type: 'text', text: codeContent.join('\n'), styles: {} }],
                  });
                  inCodeBlock = false;
                  codeContent = [];
                  codeLanguage = '';
                } else {
                  // Start code block
                  inCodeBlock = true;
                  codeLanguage = trimmed.slice(3).trim();
                }
                continue;
              }
              
              if (inCodeBlock) {
                codeContent.push(line);
                continue;
              }
              
              // Skip empty lines
              if (!trimmed) {
                continue;
              }
              
              // Headings (# ## ###)
              if (trimmed.startsWith('#')) {
                const level = trimmed.match(/^#+/)?.[0].length || 1;
                const text = trimmed.replace(/^#+\s*/, '');
                blocks.push({
                  type: 'heading',
                  props: { level: Math.min(level, 3) },
                  content: parseInlineStyles(text),
                });
              }
              // Bullet list (- or *)
              else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const text = trimmed.slice(2);
                blocks.push({
                  type: 'bulletListItem',
                  content: parseInlineStyles(text),
                });
              }
              // Numbered list (1. 2. 3.)
              else if (/^\d+\.\s/.test(trimmed)) {
                const text = trimmed.replace(/^\d+\.\s/, '');
                blocks.push({
                  type: 'numberedListItem',
                  content: parseInlineStyles(text),
                });
              }
              // Blockquote (>)
              else if (trimmed.startsWith('> ')) {
                const text = trimmed.slice(2);
                blocks.push({
                  type: 'paragraph',
                  content: parseInlineStyles(text),
                });
              }
              // Horizontal rule (---)
              else if (trimmed === '---' || trimmed === '***') {
                // BlockNote doesn't have hr, skip or use paragraph
                continue;
              }
              // Regular paragraph
              else {
                blocks.push({
                  type: 'paragraph',
                  content: parseInlineStyles(trimmed),
                });
              }
            }
            
            if (blocks.length > 0) {
              editor.replaceBlocks(editor.document, blocks);
              setContent(JSON.stringify(blocks));
            }
          }
        }
      } catch (error) {
        console.error('Error parsing rich content:', error);
      }
    }
  }, [richContent?.markdown, editor, editorRight]);

  // Reflect external updates (e.g., notes appended from Web Content) after mount
  useEffect(() => {
    try {
      if (!richContent?.markdown) return;
      // If store content differs from local state, refresh editor content
      if (richContent.markdown !== content) {
        let contentData: any;
        try {
          contentData = JSON.parse(richContent.markdown);
          if (contentData && typeof contentData === 'object' && contentData.leftContent !== undefined) {
            const leftBlocks = JSON.parse(contentData.leftContent || '[]');
            editor.replaceBlocks(editor.document, leftBlocks);
            setContent(contentData.leftContent);
            if (contentData.rightContent && contentData.rightContent !== '[]') {
              const rightBlocks = JSON.parse(contentData.rightContent);
              editorRight.replaceBlocks(editorRight.document, rightBlocks);
              setRightContent(contentData.rightContent);
            }
          } else {
            // Simple array structure
            editor.replaceBlocks(editor.document, Array.isArray(contentData) ? contentData : []);
            setContent(richContent.markdown);
          }
        } catch (_e) {
          // Ignore parse errors
        }
      }
    } catch (_err) {
      // swallow
    }
  }, [richContent?.markdown]);

  // Convert blob URLs to data URLs in content for persistence
  const processContentForSaving = useCallback(async (leftContent: string, rightContent: string = ''): Promise<string> => {
    try {
      // Try to parse as JSON first
      let leftBlocks;
      try {
        leftBlocks = JSON.parse(leftContent);
      } catch (parseError) {
        // Not JSON, likely plain markdown from AI - don't save yet, wait for proper blocks
        return JSON.stringify({
          leftContent: JSON.stringify([]),
          rightContent: JSON.stringify([]),
          splitView: false
        });
      }
      
      // Process left content
      const processedLeftBlocks = await Promise.all(
        leftBlocks.map(async (block: any) => {
          if (block.type === 'image' && block.props?.url) {
            const url = block.props.url;
            if (url.startsWith('blob:')) {
              try {
                const dataUrl = await blobUrlToDataUrl(url);
                return {
                  ...block,
                  props: {
                    ...block.props,
                    url: dataUrl
                  }
                };
              } catch (error) {
                console.error('Error converting blob URL to data URL:', error);
                return block; // Keep original if conversion fails
              }
            }
          }
          return block;
        })
      );

      // Process right content if it exists
      let processedRightBlocks: any[] = [];
      if (rightContent) {
        const rightBlocks = JSON.parse(rightContent);
        processedRightBlocks = await Promise.all(
          rightBlocks.map(async (block: any) => {
            if (block.type === 'image' && block.props?.url) {
              const url = block.props.url;
              if (url.startsWith('blob:')) {
                try {
                  const dataUrl = await blobUrlToDataUrl(url);
                  return {
                    ...block,
                    props: {
                      ...block.props,
                      url: dataUrl
                    }
                  };
                } catch (error) {
                  console.error('Error converting blob URL to data URL:', error);
                  return block; // Keep original if conversion fails
                }
              }
            }
            return block;
          })
        );
      }

      // Create the new content structure
      const contentStructure = {
        leftContent: JSON.stringify(processedLeftBlocks),
        rightContent: JSON.stringify(processedRightBlocks),
        splitView: splitView
      };

      return JSON.stringify(contentStructure);
    } catch (error) {
      console.error('Error processing content for saving:', error);
      // Fallback to simple structure for backward compatibility
      return leftContent;
    }
  }, [splitView]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    const now = Date.now();
    const hasLeftContent = content && content.trim() && content !== '[]';
    const hasRightContent = rightContent && rightContent.trim() && rightContent !== '[]';
    const hasContent = hasLeftContent || hasRightContent;
    const leftChanged = content !== lastSavedContent;
    const rightChanged = rightContent !== lastSavedRightContent;
    const changed = leftChanged || rightChanged;
    const dueByInterval = now - lastSaveAtMs >= MIN_SAVE_INTERVAL_MS;

    if (hasContent && changed && dueByInterval) {
      setIsSaving(true);
      try {
        const processedContent = await processContentForSaving(content, rightContent);
        await saveRichNoteVersion(cardId, processedContent);
        setLastSaved(new Date());
        setLastSavedContent(content);
        setLastSavedRightContent(rightContent);
        setLastSaveAtMs(now);
      } catch (error) {
        console.error('Rich note save error:', error);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    }
  }, [content, rightContent, cardId, saveRichNoteVersion, lastSavedContent, lastSavedRightContent, lastSaveAtMs, processContentForSaving, splitView]);

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
  }, [content, rightContent, autoSave]);

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

  // Function to detect and convert image URLs to image blocks
  const detectAndConvertImageUrls = useCallback((blocks: any[]) => {
    const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?/gi;
    let hasChanges = false;
    const newBlocks: any[] = [];

    for (const block of blocks) {
      if (block.type === 'paragraph' && block.content) {
        const textContent = block.content
          .map((item: any) => typeof item === 'string' ? item : (item?.text || ''))
          .join('');
        
        const imageUrls = textContent.match(imageUrlRegex);
        
        if (imageUrls && imageUrls.length > 0) {
          // Split the text by image URLs
          const parts = textContent.split(imageUrlRegex);
          const urls = textContent.match(imageUrlRegex) || [];
          
          let currentIndex = 0;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            // Add text part if it's not empty
            if (part.trim()) {
              newBlocks.push({
                type: 'paragraph',
                content: [{ type: 'text', text: part }],
              });
            }
            
            // Add image block for each URL
            if (urls[currentIndex]) {
              newBlocks.push({
                type: 'image',
                props: { 
                  url: urls[currentIndex], 
                  alt: `Image from ${new URL(urls[currentIndex]).hostname}` 
                },
              });
              currentIndex++;
            }
          }
          hasChanges = true;
        } else {
          newBlocks.push(block);
        }
      } else {
        newBlocks.push(block);
      }
    }

    if (hasChanges) {
      editor.replaceBlocks(editor.document, newBlocks);
    }
  }, [editor]);

  // Handle content changes from BlockNote (no immediate save; debounced via autoSave effect)
  const handleContentChange = useCallback(() => {
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);
    setContent(jsonContent);
    
    // Detect and convert image URLs
    detectAndConvertImageUrls(blocks);
  }, [editor, detectAndConvertImageUrls]);

  const handleContentChangeRight = useCallback(() => {
    const blocks = editorRight.document;
    const jsonContent = JSON.stringify(blocks);
    setRightContent(jsonContent);
    
    // Detect and convert image URLs in right editor
    detectAndConvertImageUrls(blocks);
  }, [editorRight, detectAndConvertImageUrls]);

  // Function to merge right panel content into left panel
  const mergeRightContentIntoLeft = useCallback(() => {
    if (rightContent && rightContent.trim() && rightContent !== '[]') {
      try {
        const rightBlocks = JSON.parse(rightContent);
        
        // Add a separator block if left content exists
        const leftBlocks = editor.document;
        const hasLeftContent = leftBlocks.length > 1 || 
          (leftBlocks.length === 1 && leftBlocks[0].content && 
           Array.isArray(leftBlocks[0].content) && leftBlocks[0].content.length > 0);
        
        if (hasLeftContent) {
          // Insert separator paragraph first
          editor.insertBlocks([{
            type: 'paragraph',
            content: [{ type: 'text', text: '---', styles: { bold: true } }],
            id: `separator-${Date.now()}`
          }], leftBlocks[leftBlocks.length - 1], 'after');
          
          // Then insert right content after the separator
          editor.insertBlocks(rightBlocks, leftBlocks[leftBlocks.length - 1], 'after');
        } else {
          // If left is empty, replace with right content
          editor.replaceBlocks(editor.document, rightBlocks);
        }
        
        // Update the content state
        const mergedContent = JSON.stringify(editor.document);
        setContent(mergedContent);
        
        // Clear right content and editor
        setRightContent('');
        editorRight.replaceBlocks(editorRight.document, [{
          type: 'paragraph',
          content: [],
          id: 'initial-paragraph'
        }]);
      } catch (error) {
        console.error('Error merging right content into left:', error);
      }
    }
  }, [rightContent, editor, editorRight]);

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






  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If no pattern matches, try to extract from query parameters
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } catch {
      return null;
    }
  };

  // Helper function to convert Spotify URL to embed URL
  const getSpotifyEmbedUrl = (url: string): string | null => {
    const patterns = [
      /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const [, type, id] = match;
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    }

    return null;
  };

  // Calculate Bezier curve path for connection
  const calculateConnectionPath = (connection: CardConnection): string => {
    const sourceX = connection.sourcePosition.x + connection.sourceSize.width;
    const sourceY = connection.sourcePosition.y + connection.sourceSize.height / 2;
    const targetX = connection.targetPosition.x;
    const targetY = connection.targetPosition.y + connection.targetSize.height / 2;

    // Control points for Bezier curve
    const controlPointOffset = Math.abs(targetX - sourceX) * 0.4;
    const cp1x = sourceX + controlPointOffset;
    const cp1y = sourceY;
    const cp2x = targetX - controlPointOffset;
    const cp2y = targetY;

    return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
  };

  // Handle media card creation
  const handleCreateVideoCard = async () => {
    try {
      // Validate input based on media type
      if (videoType !== 'file' && !videoUrl.trim()) {
        alert('Lütfen geçerli bir medya URL girin');
        return;
      }

      if (videoType === 'file' && !videoFile) {
        alert('Lütfen bir medya dosyası seçin');
        return;
      }

      // Get current card position for positioning the video card
      const currentCard = cards.find(c => c.id === cardId);
      if (!currentCard) return;

      // Create media card with connection to current card
      const mediaCardId = `media-${Date.now()}`;
      const defaultTitle = videoType === 'spotify' ? 'Spotify' :
                          videoType === 'youtube' ? 'YouTube Video' :
                          videoType === 'direct' ? 'Video' : 'Medya';

      const mediaCard = {
        id: mediaCardId,
        type: 'platformContent' as const,
        title: videoTitle || defaultTitle,
        content: JSON.stringify({
          videoType,
          videoUrl: videoType !== 'file' ? videoUrl : '',
          videoFile: videoType === 'file' && videoFile ? videoFile.name : null,
          videoTitle: videoTitle || '',
          connectedTo: cardId, // Reference to the source card
        }),
        position: {
          x: currentCard.position.x + currentCard.size.width + 50, // Position to the right
          y: currentCard.position.y,
        },
        size: { width: 400, height: 352 }, // Spotify embed height
        zIndex: Math.max(...cards.map(c => c.zIndex), 0) + 1,
      };

      // Add the media card
      await addCard(mediaCard);

      // Create connection between cards
      const newConnection: CardConnection = {
        id: `connection-${mediaCardId}`,
        sourceCardId: cardId,
        targetCardId: mediaCardId,
        sourcePosition: currentCard.position,
        targetPosition: mediaCard.position,
        sourceSize: currentCard.size,
        targetSize: mediaCard.size,
      };

      setConnections(prev => [...prev, newConnection]);

      // Reset dialog state
      setVideoUrl('');
      setVideoTitle('');
      setVideoFile(null);
      setVideoType('youtube');
      setShowVideoDialog(false);

      console.log('🎵 Media Card Created Successfully:', mediaCard);

    } catch (error) {
      console.error('Error creating media card:', error);
      alert('Medya kartı oluşturulurken hata oluştu');
    }
  };

  // Export functionality
  const exportToPDF = async () => {
    try {
      const blocks = editor.document;
      const text = blocks.map(block => {
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          return block.content.map(item => {
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
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          return `<p>${block.content.map(item => {
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
            onClick={() => {
              if (splitView) {
                // If closing split view, merge right content into left first
                mergeRightContentIntoLeft();
              }
              setSplitView((v) => !v);
            }}
            title={splitView ? 'Disable split view' : 'Enable split view'}
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

          {/* Video Dialog */}
          <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Medya Ekle</DialogTitle>
                <DialogDescription>
                  YouTube URL, Spotify link, direkt video URL veya yerel dosya yükleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Medya Tipi</Label>
                  <Select value={videoType} onValueChange={(value: 'youtube' | 'direct' | 'file' | 'spotify') => setVideoType(value)}>
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

                {videoType === 'youtube' && (
                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                )}

                {videoType === 'spotify' && (
                  <div className="space-y-2">
                    <Label>Spotify URL</Label>
                    <Input
                      placeholder="https://open.spotify.com/track/... veya https://open.spotify.com/playlist/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                )}

                {videoType === 'direct' && (
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                )}

                {videoType === 'file' && (
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
                {videoUrl && videoType !== 'file' && (
                  <div className="space-y-2">
                    <Label>Önizleme</Label>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      {videoType === 'youtube' ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl) || 'dQw4w9WgXcQ'}?rel=0&modestbranding=1`}
                          className="w-full h-full rounded-md"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          title="YouTube Video Preview"
                        />
                      ) : videoType === 'spotify' ? (
                        <iframe
                          src={getSpotifyEmbedUrl(videoUrl) || 'https://open.spotify.com/embed/playlist/2VLBh9qpGUB7a6hQxIdGtw'}
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
                <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateVideoCard}>
                  Medya Kartı Oluştur
                </Button>
              </DialogFooter>
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

      {/* Connection Visualization */}
      {connections.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
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
              {/* Connection endpoints */}
              <circle
                cx={connection.sourcePosition.x + connection.sourceSize.width}
                cy={connection.sourcePosition.y + connection.sourceSize.height / 2}
                r="4"
                fill="hsl(var(--primary))"
                className="animate-pulse"
              />
              <circle
                cx={connection.targetPosition.x}
                cy={connection.targetPosition.y + connection.targetSize.height / 2}
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