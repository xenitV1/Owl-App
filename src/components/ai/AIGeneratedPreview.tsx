"use client";

import { useTranslations } from "next-intl";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, FileQuestion, BookOpen } from "lucide-react";
import type { GeneratedContent, Flashcard, Question } from "@/types/ai";
import type { AppStudyNote as StudyNote } from "@/types/studyNote";

interface AIGeneratedPreviewProps {
  content: GeneratedContent;
}

export function AIGeneratedPreview({ content }: AIGeneratedPreviewProps) {
  const t = useTranslations("ai");

  const getIcon = () => {
    switch (content.type) {
      case "flashcards":
        return <Brain className="h-5 w-5" />;
      case "questions":
        return <FileQuestion className="h-5 w-5" />;
      case "notes":
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const renderFlashcards = (flashcards: Flashcard[]) => (
    <div className="space-y-3">
      {flashcards.map((card, index) => (
        <Card key={card.id || index} className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("front")}</p>
                <p className="font-medium">{card.front}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("backSide")}</p>
                <p>{card.back}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {t("difficulty")}: {card.difficulty}/5
                </Badge>
                {card.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderQuestions = (questions: Question[]) => (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <Card key={q.id || index} className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{t(`questionTypes.${q.type}`)}</Badge>
                  <Badge variant="secondary">
                    {t("difficulty")}: {q.difficulty}/5
                  </Badge>
                  <Badge variant="outline">{q.bloomLevel}</Badge>
                </div>
                <p className="font-medium">{q.question}</p>
              </div>

              {q.options && q.options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("options")}:
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((option, optIndex) => {
                      const isCorrect = option === q.correctAnswer;
                      const optionLabel = ["A", "B", "C", "D", "E"][optIndex];

                      return (
                        <div
                          key={optIndex}
                          className={`flex items-start gap-2 p-2 rounded-md ${
                            isCorrect
                              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                              : "bg-muted/30"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                          >
                            {optionLabel}
                          </div>
                          <p
                            className={`text-sm flex-1 ${isCorrect ? "font-medium text-green-700 dark:text-green-400" : ""}`}
                          >
                            {option}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">
                  {t("correctAnswer")}:
                </p>
                <p className="text-green-600 font-medium">{q.correctAnswer}</p>
              </div>

              {q.explanation && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("explanation")}:
                  </p>
                  <p className="text-sm">{q.explanation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderNotes = (note: StudyNote) => (
    <Card>
      <CardContent className="p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none katex-container">
          <MarkdownRenderer content={note.content} />
        </div>
      </CardContent>
    </Card>
  );

  // Removed ad-hoc markdown converter in favor of MarkdownRenderer

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            <span>{content.title}</span>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {t(`contentTypes.${content.type}`)}
            </Badge>
            <Badge variant="outline">
              {t(`ageGroups.${content.metadata.ageGroup}`)}
            </Badge>
            {content.metadata.subject && (
              <Badge>{content.metadata.subject}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(content.metadata.generatedAt).toLocaleString()}
            </span>
          </div>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        {content.type === "flashcards" &&
          renderFlashcards(content.content as Flashcard[])}
        {content.type === "questions" &&
          renderQuestions(content.content as Question[])}
        {content.type === "notes" && renderNotes(content.content as StudyNote)}
      </ScrollArea>

      <p className="text-sm text-muted-foreground text-center">
        {t("previewNote")}
      </p>
    </div>
  );
}
