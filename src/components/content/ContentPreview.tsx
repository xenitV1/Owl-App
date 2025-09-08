'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  maxLength = 150,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Eğer içerik kısa ise, sadece göster
  if (content.length <= maxLength) {
    return (
      <div className={className + ' break-words break-all whitespace-pre-wrap'}>
        {content}
      </div>
    );
  }

  // İçerik uzun ise, kısalt ve "Show More" ekle
  const truncatedContent = content.substring(0, maxLength).trim();
  const remainingContent = content.substring(maxLength);

  return (
    <div className={className + ' break-words break-all whitespace-pre-wrap'}>
      <div>
        {isExpanded ? (
          <>
            {content}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="ml-2 h-auto p-0 text-primary hover:text-primary/80"
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </Button>
          </>
        ) : (
          <>
            {truncatedContent}
            {remainingContent.length > 0 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="ml-2 h-auto p-0 text-primary hover:text-primary/80"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show More
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

