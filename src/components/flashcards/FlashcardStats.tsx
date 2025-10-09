/**
 * Flashcard Statistics Display Component
 * Shows overview and detailed statistics for flashcard system
 */

"use client";

import { FlashcardStats } from "@/types/flashcard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Target, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface FlashcardStatsProps {
  stats: FlashcardStats;
}

export function FlashcardStatsDisplay({ stats }: FlashcardStatsProps) {
  const t = useTranslations("flashcards");

  return (
    <>
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{t("totalCards")}</p>
                <p className="text-2xl font-bold">{stats.totalCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">{t("cardsDue")}</p>
                <p className="text-2xl font-bold">{stats.cardsDue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{t("accuracy")}</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.accuracy)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">{t("studyStreak")}</p>
                <p className="text-2xl font-bold">{stats.studyStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      {stats.totalCards > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t("performance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.accuracy)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("accuracy")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(stats.totalStudyTime / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("totalStudyTime")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.studyStreak}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("studyStreak")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageDifficulty.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("averageDifficulty")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
