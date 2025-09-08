'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BookOpen, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrendingSubject {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  recentPosts: number;
}

export function TrendingSubjects() {
  const [subjects, setSubjects] = useState<TrendingSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTrendingSubjects();
  }, []);

  const fetchTrendingSubjects = async () => {
    try {
      const response = await fetch('/api/posts/trending-subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching trending subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectClick = (subjectName: string) => {
    router.push(`/discover?subject=${encodeURIComponent(subjectName)}`);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Hash className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Trending Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Trending Subjects
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No trending subjects available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => handleSubjectClick(subject.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(subject.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(subject.trend)}`}>
                      {subject.trend === 'up' ? '+' : subject.trend === 'down' ? '-' : ''}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {subject.count}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {subject.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {subject.recentPosts} recent posts
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
