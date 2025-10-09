"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface MostReadNote {
  id: string;
  title: string;
  subject?: string;
  viewCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
}

export function MostReadNotes() {
  const [notes, setNotes] = useState<MostReadNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    fetchMostReadNotes();
  }, []);

  const fetchMostReadNotes = async () => {
    try {
      const response = await fetch("/api/posts/most-read");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Error fetching most read notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteClick = (noteId: string) => {
    // Bu component'te post detail modal'ı yok, geçici olarak kaldırıldı
    console.log("Note clicked:", noteId);
    // TODO: Post detail modal'ını açmak için parent component'e callback eklenebilir
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Most Read Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Most Read Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notes available</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => handleNoteClick(note.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={note.author.avatar}
                    alt={note.author.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {note.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {note.author.name}
                    </span>
                    {note.author.role && (
                      <Badge variant="secondary" className="text-xs">
                        {note.author.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {note.subject && (
                      <Badge variant="outline" className="text-xs">
                        {note.subject}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{formatViewCount(note.viewCount)} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
