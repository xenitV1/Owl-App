'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import type { Flashcard } from '@/types/ai';

interface AIFlashcardViewerProps {
  flashcards: Flashcard[];
  title?: string;
}

export function AIFlashcardViewer({ flashcards, title }: AIFlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <p className="text-sm text-muted-foreground">No flashcards available</p>;
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-4">
      {title && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary">{flashcards.length} Cards</Badge>
        </motion.div>
      )}

      <div className="relative perspective-1000">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${currentIndex}-${isFlipped}`}
            initial={{ 
              rotateY: isFlipped ? -180 : 0, 
              opacity: 0,
              scale: 0.95
            }}
            animate={{ 
              rotateY: 0, 
              opacity: 1,
              scale: 1
            }}
            exit={{ 
              rotateY: isFlipped ? 180 : -180, 
              opacity: 0,
              scale: 0.95
            }}
            transition={{ 
              duration: 0.3, // Faster! (was 0.6)
              ease: [0.4, 0, 0.2, 1] // Smoother easing
            }}
            style={{ 
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
          >
            <Card
              className="min-h-[250px] cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
              onClick={handleFlip}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[250px]">
                <motion.div 
                  className="text-center space-y-4 w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }} // Faster delay
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {isFlipped ? 'Back' : 'Front'}
                  </p>
                  <p className="text-lg leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                  {!isFlipped && (
                    <motion.p 
                      className="text-xs text-muted-foreground"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Click to flip
                    </motion.p>
                  )}
                </motion.div>

                {isFlipped && (
                  <motion.div 
                    className="mt-4 flex items-center gap-2 flex-wrap justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Badge variant="secondary">
                      Difficulty: {currentCard.difficulty}/5
                    </Badge>
                    {currentCard.tags.map((tag, idx) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                      >
                        <Badge variant="outline">{tag}</Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
          className="transition-all hover:scale-105"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <motion.span 
            key={currentIndex}
            className="text-sm text-muted-foreground font-medium"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {currentIndex + 1} / {flashcards.length}
          </motion.span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleFlip}
            className="transition-all hover:rotate-180 duration-300"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
          className="transition-all hover:scale-105"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

