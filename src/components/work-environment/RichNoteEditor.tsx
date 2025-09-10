'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
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
  Calculator
} from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface RichNoteEditorProps {
  cardId: string;
  initialContent?: string;
  onClose?: () => void;
}

export function RichNoteEditor({ cardId, initialContent = '', onClose }: RichNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { saveRichNoteVersion, cards } = useWorkspaceStore();

  const card = cards.find(c => c.id === cardId);
  const richContent = card?.richContent;

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (content !== initialContent && content.trim()) {
      setIsSaving(true);
      saveRichNoteVersion(cardId, content);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [content, initialContent, cardId, saveRichNoteVersion]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, autoSave]);

  // Manual save
  const handleManualSave = () => {
    autoSave();
  };

  // Insert markdown syntax
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const newText = before + (selectedText || placeholder) + after;
    const newContent = content.substring(0, start) + newText + content.substring(end);

    setContent(newContent);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selectedText || placeholder).length);
    }, 0);
  };

  // Toolbar actions
  const toolbarActions = [
    { icon: Bold, action: () => insertMarkdown('**', '**', 'bold text'), tooltip: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'italic text'), tooltip: 'Italic' },
    { icon: Code, action: () => insertMarkdown('`', '`', 'code'), tooltip: 'Inline Code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)', 'link text'), tooltip: 'Link' },
    { icon: Image, action: () => insertMarkdown('![', '](url)', 'alt text'), tooltip: 'Image' },
    { icon: List, action: () => insertMarkdown('- ', '', 'list item'), tooltip: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. ', '', 'numbered item'), tooltip: 'Numbered List' },
    { icon: Quote, action: () => insertMarkdown('> ', '', 'quote'), tooltip: 'Quote' },
    { icon: Calculator, action: () => insertMarkdown('$$', '$$', '\\LaTeX formula'), tooltip: 'Math Formula' },
  ];

  // Convert markdown to HTML for preview
  const markdownToHtml = (markdown: string) => {
    // Basic markdown conversion (simplified - in production, use a proper library)
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="font-semibold">Rich Note Editor</h3>
          {lastSaved && (
            <Badge variant="secondary" className="text-xs">
              {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersionHistory(!showVersionHistory)}
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {!isPreview && (
        <div className="flex items-center gap-1 p-3 border-b bg-muted/30">
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              title={action.tooltip}
              className="h-8 w-8 p-0"
            >
              <action.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="flex-1 p-4 overflow-auto">
        {isPreview ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your rich note... Use Markdown syntax for formatting."
            className="w-full h-full resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-sm leading-relaxed"
          />
        )}
      </div>

      {/* Version History */}
      {showVersionHistory && richContent?.versionHistory && (
        <div className="border-t p-4 max-h-48 overflow-y-auto">
          <h4 className="font-medium mb-2">Version History</h4>
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
