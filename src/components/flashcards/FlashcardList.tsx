/**
 * Flashcard List Component
 * Displays grid of flashcards with edit/delete actions
 */

"use client";

import { Flashcard } from "@/types/flashcard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Edit, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FlashcardListProps {
  flashcards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onDelete: (cardId: string) => void;
  onCreate: () => void;
}

export function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
  onCreate,
}: FlashcardListProps) {
  const t = useTranslations("flashcards");

  if (flashcards.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="col-span-full">
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noCards")}</h3>
            <p className="text-muted-foreground mb-4">{t("createFirstCard")}</p>
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {t("createCard")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((card) => (
        <Card key={card.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{card.front}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{card.category}</Badge>
              {card.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(card)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(t("confirmDelete"))) {
                    onDelete(card.id);
                  }
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {card.back}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("nextReview")}: {card.nextReview.toLocaleDateString()}
              </span>
              <Badge
                variant={
                  card.nextReview <= new Date() ? "destructive" : "secondary"
                }
              >
                {t("difficulty")}: {card.difficulty}/5
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
