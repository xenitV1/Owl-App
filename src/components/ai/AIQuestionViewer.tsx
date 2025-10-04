'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import type { Question } from '@/types/ai';

interface AIQuestionViewerProps {
  questions: Question[];
  title?: string;
}

export function AIQuestionViewer({ questions, title }: AIQuestionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions available</p>;
  }

  const currentQuestion = questions[currentIndex];
  const optionLabels = ['A', 'B', 'C', 'D', 'E'];

  const handleNext = () => {
    setShowAnswer(false);
    setSelectedOption(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setSelectedOption(null);
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  const handleOptionClick = (option: string) => {
    if (!showAnswer) {
      setSelectedOption(option);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
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
          <Badge variant="secondary">{questions.length} Questions</Badge>
        </motion.div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ 
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-6 space-y-4">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {currentQuestion.type.replace('_', ' ')}
                    </Badge>
                    <h4 className="text-lg font-medium leading-relaxed">
                      {currentQuestion.question}
                    </h4>
                  </div>
                  <Badge variant="secondary">
                    {currentQuestion.difficulty}/5
                  </Badge>
                </div>

                {/* Options for Multiple Choice */}
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {currentQuestion.options.map((option, idx) => {
                      const isCorrect = showAnswer && option === currentQuestion.correctAnswer;
                      const isSelected = selectedOption === option;
                      const isWrong = showAnswer && isSelected && option !== currentQuestion.correctAnswer;
                      
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleOptionClick(option)}
                          disabled={showAnswer}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : isWrong
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                              : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary hover:bg-accent'
                          } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect 
                                ? 'bg-green-500 text-white' 
                                : isWrong
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {optionLabels[idx]}
                            </div>
                            <p className="flex-1 text-sm">{option}</p>
                            {isCorrect && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {isWrong && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* True/False */}
                {currentQuestion.type === 'true_false' && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {['true', 'false'].map((option, idx) => {
                      const isCorrect = showAnswer && option === currentQuestion.correctAnswer.toLowerCase();
                      const isSelected = selectedOption === option;
                      const isWrong = showAnswer && isSelected && option !== currentQuestion.correctAnswer.toLowerCase();
                      
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleOptionClick(option)}
                          disabled={showAnswer}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : isWrong
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                              : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary hover:bg-accent'
                          } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect 
                                ? 'bg-green-500 text-white' 
                                : isWrong
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {option === 'true' ? '✓' : '✗'}
                            </div>
                            <p className="flex-1 text-sm capitalize font-medium">{option}</p>
                            {isCorrect && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {isWrong && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* Fill in the Blank / Open Ended */}
                {(currentQuestion.type === 'fill_blank' || currentQuestion.type === 'open_ended') && (
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-2">Your Answer:</p>
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        disabled={showAnswer}
                        value={selectedOption || ''}
                        onChange={(e) => !showAnswer && setSelectedOption(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                    
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      >
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Correct Answer:</p>
                        <p className="text-sm font-medium">{currentQuestion.correctAnswer}</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Show Answer Button */}
                {!showAnswer && (
                  <Button 
                    onClick={toggleAnswer} 
                    variant="outline" 
                    className="w-full"
                    disabled={!selectedOption || selectedOption.trim() === ''}
                  >
                    {!selectedOption || selectedOption.trim() === ''
                      ? 'Select or enter your answer first' 
                      : 'Show Answer'}
                  </Button>
                )}

                {/* Answer Explanation */}
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Explanation
                        </div>
                        <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>
                        <div className="flex gap-2 pt-2">
                          <Badge variant="outline" className="text-xs">
                            {currentQuestion.bloomLevel}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
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
          disabled={questions.length <= 1}
          className="transition-all hover:scale-105"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <motion.div
          key={currentIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-muted-foreground font-medium"
        >
          Question {currentIndex + 1} / {questions.length}
        </motion.div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={questions.length <= 1}
          className="transition-all hover:scale-105"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

