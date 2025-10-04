'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AINotesViewerProps {
  content: string; // Markdown content
  title?: string;
  defaultExpanded?: boolean;
  maxHeight?: number; // in pixels
}

export function AINotesViewer({ content, title, defaultExpanded = false, maxHeight = 400 }: AINotesViewerProps) {
  const t = useTranslations('ai');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!content) {
    return <p className="text-sm text-muted-foreground">No notes available</p>;
  }

  // Convert markdown to HTML (same as AIGeneratedPreview)
  const convertMarkdownToHTML = (markdown: string): string => {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">$1</blockquote>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');
    
    // Lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li>[\s\S]*<\/li>)/gm, '<ul class="list-disc list-inside my-2">$1</ul>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = '<p class="mb-3">' + html + '</p>';
    
    return html;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6 space-y-4">
        {title && (
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
        )}
        <div 
          className={`prose prose-sm dark:prose-invert max-w-none overflow-hidden transition-all duration-300 ${
            isExpanded ? '' : 'relative'
          }`}
          style={{ 
            maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(content) }} />
          
          {/* Gradient overlay when collapsed */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* Show More/Less Button */}
        <div className="flex justify-center pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t('showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t('showMore')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

