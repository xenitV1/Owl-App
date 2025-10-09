/**
 * Flashcard Study Mode Component
 * Handles the study interface with card flipping and quality ratings
 */

"use client";

import { Flashcard, StudySession } from "@/types/flashcard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Image as ImageIcon,
  Volume2,
  Video,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  Brain,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface FlashcardStudyModeProps {
  currentCard: Flashcard;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onResponse: (quality: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function FlashcardStudyMode({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onResponse,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: FlashcardStudyModeProps) {
  const t = useTranslations("flashcards");

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center">
          {/* Progress Bar */}
          <div className="mb-4">
            <Progress
              value={(currentIndex / totalCards) * 100}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {currentIndex + 1} / {totalCards}
            </p>
          </div>

          {/* Flashcard Content */}
          <div
            className={`min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-300 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={onFlip}
          >
            <div className="text-center max-w-full">
              {/* Text Card */}
              {currentCard.type === "text" && !currentCard.mediaUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-medium">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  {!isFlipped && (
                    <p className="text-muted-foreground">{t("clickToFlip")}</p>
                  )}
                </div>
              )}

              {/* Image Card */}
              {currentCard.type === "image" && currentCard.mediaUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <ImageIcon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-medium mb-4">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="max-w-md mx-auto">
                    <img
                      src={currentCard.mediaUrl}
                      alt="Flashcard media"
                      className="max-w-full max-h-64 object-cover rounded-lg shadow-md"
                    />
                  </div>
                  {!isFlipped && (
                    <p className="text-muted-foreground mt-4">
                      {t("clickToFlip")}
                    </p>
                  )}
                </div>
              )}

              {/* Audio Card */}
              {currentCard.type === "audio" && currentCard.mediaUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-medium mb-4">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="max-w-md mx-auto">
                    <audio
                      controls
                      className="w-full"
                      src={currentCard.mediaUrl}
                    >
                      {t("audioNotSupported")}
                    </audio>
                  </div>
                  {!isFlipped && (
                    <p className="text-muted-foreground mt-4">
                      {t("clickToFlip")}
                    </p>
                  )}
                </div>
              )}

              {/* Video Card */}
              {currentCard.type === "video" && currentCard.mediaUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-medium mb-4">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="max-w-md mx-auto">
                    <video
                      controls
                      className="max-w-full max-h-64 rounded-lg shadow-md"
                      src={currentCard.mediaUrl}
                    >
                      {t("videoNotSupported")}
                    </video>
                  </div>
                  {!isFlipped && (
                    <p className="text-muted-foreground mt-4">
                      {t("clickToFlip")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quality Rating Buttons */}
          {isFlipped && (
            <div className="mt-8 flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => onResponse(1)}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {t("hard")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onResponse(2)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t("medium")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onResponse(3)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {t("good")}
              </Button>
              <Button
                onClick={() => onResponse(4)}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {t("easy")}
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!canGoNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SessionSummaryProps {
  session: StudySession;
}

export function SessionSummary({ session }: SessionSummaryProps) {
  const t = useTranslations("flashcards");

  return (
    <Card className="max-w-md mx-auto mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <CheckCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{t("sessionComplete")}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>{t("cardsStudied")}:</span>
            <span className="font-semibold">{session.cardsStudied}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("correctAnswers")}:</span>
            <span className="font-semibold text-green-600">
              {session.correctAnswers}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("averageTime")}:</span>
            <span className="font-semibold">
              {Math.round(session.sessionDuration / session.cardsStudied || 0)}s
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("accuracy")}:</span>
            <span className="font-semibold">
              {Math.round(
                (session.correctAnswers / session.cardsStudied) * 100,
              ) || 0}
              %
            </span>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground text-center">
              {t("greatJob")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
