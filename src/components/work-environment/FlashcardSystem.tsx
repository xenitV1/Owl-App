'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import {
  Plus,
  Play,
  RotateCcw,
  TrendingUp,
  Brain,
  Clock,
  Target,
  FileText,
  Image as ImageIcon,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Upload,
  Video,
  X,
  Edit
} from 'lucide-react';

interface Flashcard {
  id: string;
  cardId?: string; // Workspace card ID that owns this flashcard
  front: string;
  back: string;
  type: 'text' | 'image' | 'audio' | 'video';
  mediaUrl?: string;
  difficulty: number; // 1-5 scale
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  lastReviewed?: Date;
  tags: string[];
  category: string;
}

interface StudySession {
  id: string;
  startTime: Date;
  cardsStudied: number;
  correctAnswers: number;
  averageResponseTime: number;
  sessionDuration: number;
  sessionDate: Date;
}

interface FlashcardStats {
  id: string;
  totalCards: number;
  cardsDue: number;
  averageDifficulty: number;
  studyStreak: number;
  totalStudyTime: number;
  accuracy: number;
  lastUpdated: Date;
}

interface FlashcardSystemProps {
  cardId?: string;
}

export default function FlashcardSystem({ cardId }: FlashcardSystemProps) {
  const t = useTranslations('flashcards');
  const {
    getAllFlashcards,
    saveFlashcard,
    deleteFlashcard,
    getFlashcardStats,
    saveFlashcardStats,
    saveStudySession,
    getStudySessions,
    isIndexedDBReady
  } = useWorkspaceStore();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [stats, setStats] = useState<FlashcardStats>({
    id: 'main',
    totalCards: 0,
    cardsDue: 0,
    averageDifficulty: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    accuracy: 0,
    lastUpdated: new Date()
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Separate state for create and edit operations
  const [createCardForm, setCreateCardForm] = useState({
    front: '',
    back: '',
    type: 'text' as 'text' | 'image' | 'audio' | 'video',
    category: '',
    tags: '',
    mediaFile: null as File | null,
    mediaPreview: '' as string
  });

  const [editCardForm, setEditCardForm] = useState({
    front: '',
    back: '',
    type: 'text' as 'text' | 'image' | 'audio' | 'video',
    category: '',
    tags: '',
    mediaFile: null as File | null,
    mediaPreview: '' as string
  });

  // Helper functions for form management
  const resetCreateForm = useCallback(() => {
    setCreateCardForm({ front: '', back: '', type: 'text', category: '', tags: '', mediaFile: null, mediaPreview: '' });
  }, []);

  const resetEditForm = useCallback(() => {
    setEditCardForm({ front: '', back: '', type: 'text', category: '', tags: '', mediaFile: null, mediaPreview: '' });
  }, []);

  // SM-2 Algorithm implementation
  const calculateNextReview = useCallback((card: Flashcard, quality: number) => {
    const now = new Date();

    if (quality < 3) {
      // Failed card - reset to minimum interval
      return {
        ...card,
        interval: 1,
        repetitions: 0,
        nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
        easeFactor: Math.max(1.3, card.easeFactor - 0.2)
      };
    }

    let newInterval = card.interval;
    let newEaseFactor = card.easeFactor;

    if (card.repetitions === 0) {
      newInterval = 1;
    } else if (card.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * card.easeFactor);
    }

    newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    return {
      ...card,
      interval: newInterval,
      repetitions: card.repetitions + 1,
      nextReview: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
      easeFactor: Math.max(1.3, newEaseFactor),
      lastReviewed: now
    };
  }, []);

  // Load flashcards and stats from workspace store
  useEffect(() => {
    const loadData = async () => {
      if (!isIndexedDBReady) return;

      try {
        const cards = await getAllFlashcards(cardId);
        setFlashcards(cards);
        updateStats(cards);

        const savedStats = await getFlashcardStats();
        if (savedStats) {
          setStats(savedStats);
        }
      } catch (error) {
        console.error('❌ Flashcard verileri yüklenemedi:', error);
      }
    };

    loadData();
  }, [isIndexedDBReady, getAllFlashcards, getFlashcardStats, cardId]);

  // Listen for AI-generated flashcard imports
  useEffect(() => {
    const handleImport = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.cardId !== cardId) return;

      try {
        const importedFlashcards = detail.flashcards || [];
        
        // Save each flashcard to IndexedDB
        for (const fc of importedFlashcards) {
          const flashcard: Flashcard = {
            id: `flashcard-${Date.now()}-${Math.random()}`,
            cardId: cardId,
            front: fc.front || '',
            back: fc.back || '',
            type: 'text',
            difficulty: fc.difficulty || 3,
            nextReview: new Date(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            createdAt: new Date(),
            tags: fc.tags || [],
            category: fc.category || '',
          };
          
          await saveFlashcard(flashcard);
        }
        
        // Reload flashcards
        const cards = await getAllFlashcards(cardId);
        setFlashcards(cards);
      } catch (error) {
        console.error('❌ Failed to import AI flashcards:', error);
      }
    };

    window.addEventListener('workspace:importFlashcards', handleImport as EventListener);
    return () => window.removeEventListener('workspace:importFlashcards', handleImport as EventListener);
  }, [cardId, saveFlashcard, getAllFlashcards]);

  const updateStats = useCallback(async (cards: Flashcard[]) => {
    const now = new Date();
    const cardsDue = cards.filter(card => card.nextReview <= now).length;
    const averageDifficulty = cards.length > 0
      ? cards.reduce((sum, card) => sum + card.difficulty, 0) / cards.length
      : 0;

    const newStats: FlashcardStats = {
      id: 'main',
      totalCards: cards.length,
      cardsDue,
      averageDifficulty,
      studyStreak: stats.studyStreak,
      totalStudyTime: stats.totalStudyTime,
      accuracy: stats.accuracy,
      lastUpdated: now
    };

    setStats(newStats);
    
    if (isIndexedDBReady) {
      await saveFlashcardStats(newStats);
    }
  }, [stats.studyStreak, stats.totalStudyTime, stats.accuracy, isIndexedDBReady, saveFlashcardStats]);

  const saveCardToDB = useCallback(async (card: Flashcard) => {
    if (isIndexedDBReady) {
      await saveFlashcard(card);
    }
  }, [isIndexedDBReady, saveFlashcard]);

  const getMediaTypeFromFile = useCallback((file: File): 'image' | 'audio' | 'video' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'image'; // fallback
  }, []);

  const handleCreateCard = useCallback(async () => {
    if (!createCardForm.front.trim() || !createCardForm.back.trim()) return;

    let mediaUrl = '';

    // Handle media file if present
    if (createCardForm.mediaFile) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      mediaUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(createCardForm.mediaFile as Blob);
      });
    }

    const card: Flashcard = {
      id: Date.now().toString(),
      cardId: cardId, // Associate with the workspace card
      front: createCardForm.front,
      back: createCardForm.back,
      type: createCardForm.mediaFile ? getMediaTypeFromFile(createCardForm.mediaFile) : createCardForm.type,
      mediaUrl: mediaUrl || undefined,
      difficulty: 3,
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: new Date(),
      tags: createCardForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: createCardForm.category
    };

    const updatedCards = [...flashcards, card];
    setFlashcards(updatedCards);
    await saveCardToDB(card);
    await updateStats(updatedCards);

    // Close dialog (form will be cleared by onOpenChange)
    setIsCreateDialogOpen(false);
  }, [createCardForm, flashcards, saveCardToDB, updateStats, getMediaTypeFromFile]);

  const handleEditCard = useCallback((card: Flashcard) => {
    setEditingCard(card);
    setEditCardForm({
      front: card.front,
      back: card.back,
      type: card.type,
      category: card.category,
      tags: card.tags.join(', '),
      mediaFile: null,
      mediaPreview: card.mediaUrl || ''
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateCard = useCallback(async () => {
    if (!editingCard || !editCardForm.front.trim() || !editCardForm.back.trim()) return;

    let mediaUrl = editingCard.mediaUrl || '';

    // Handle new media file if present
    if (editCardForm.mediaFile) {
      const reader = new FileReader();
      mediaUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(editCardForm.mediaFile as Blob);
      });
    }

    const updatedCard: Flashcard = {
      ...editingCard,
      front: editCardForm.front,
      back: editCardForm.back,
      type: editCardForm.mediaFile ? getMediaTypeFromFile(editCardForm.mediaFile) : editCardForm.type,
      mediaUrl: mediaUrl || undefined,
      tags: editCardForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: editCardForm.category
    };

    const updatedCards = flashcards.map(card =>
      card.id === editingCard.id ? updatedCard : card
    );

    setFlashcards(updatedCards);
    await saveCardToDB(updatedCard);
    await updateStats(updatedCards);

    // Close dialog (form will be cleared by onOpenChange)
    setEditingCard(null);
    setIsEditDialogOpen(false);
  }, [editingCard, editCardForm, flashcards, saveCardToDB, updateStats, getMediaTypeFromFile]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    const updatedCards = flashcards.filter(card => card.id !== cardId);
    setFlashcards(updatedCards);

    // Remove from workspace IndexedDB
    await deleteFlashcard(cardId);
    await updateStats(updatedCards);
  }, [flashcards, t, updateStats, deleteFlashcard]);

  const saveSessionToDB = useCallback(async (session: StudySession) => {
    if (isIndexedDBReady) {
      await saveStudySession(session);
    }
  }, [isIndexedDBReady, saveStudySession]);

  const handleCardResponse = useCallback(async (quality: number) => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    const updatedCard = calculateNextReview(currentCard, quality);
    const updatedCards = flashcards.map(card =>
      card.id === currentCard.id ? updatedCard : card
    );

    setFlashcards(updatedCards);
    await saveCardToDB(updatedCard);
    await updateStats(updatedCards);

    // Update session statistics
    if (currentSession) {
      const isCorrect = quality >= 3; // Good or Easy responses count as correct
      const updatedSession: StudySession = {
        ...currentSession,
        cardsStudied: currentSession.cardsStudied + 1,
        correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
        sessionDuration: (new Date().getTime() - currentSession.startTime.getTime()) / 1000
      };
      setCurrentSession(updatedSession);
    }

    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // End of session
      if (currentSession) {
        const finalSession: StudySession = {
          ...currentSession,
          cardsStudied: currentSession.cardsStudied + 1,
          correctAnswers: currentSession.correctAnswers + (quality >= 3 ? 1 : 0),
          sessionDuration: (new Date().getTime() - currentSession.startTime.getTime()) / 1000
        };
        await saveSessionToDB(finalSession);

        // Update overall stats
        setStats(prev => ({
          ...prev,
          accuracy: ((prev.accuracy * (prev.totalCards - flashcards.length) + finalSession.correctAnswers) / prev.totalCards) || 0,
          totalStudyTime: prev.totalStudyTime + finalSession.sessionDuration
        }));
      }
      setStudyMode(false);
      setCurrentSession(null);
    }

    setIsFlipped(false);
  }, [currentCardIndex, flashcards, calculateNextReview, saveCardToDB, updateStats, currentSession, saveSessionToDB]);

  const startStudySession = useCallback(() => {
    const dueCards = flashcards.filter(card => card.nextReview <= new Date());
    if (dueCards.length === 0) return;

    // Sort by priority (overdue first, then by interval)
    const sortedCards = dueCards.sort((a, b) => {
      const aOverdue = (new Date().getTime() - a.nextReview.getTime()) / (24 * 60 * 60 * 1000);
      const bOverdue = (new Date().getTime() - b.nextReview.getTime()) / (24 * 60 * 60 * 1000);
      return bOverdue - aOverdue;
    });

    // Initialize study session
    const session: StudySession = {
      id: Date.now().toString(),
      startTime: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      sessionDuration: 0,
      sessionDate: new Date()
    };

    setCurrentSession(session);
    setFlashcards(sortedCards);
    setCurrentCardIndex(0);
    setStudyMode(true);
    setIsFlipped(false);
  }, [flashcards]);

  const handleCreateMediaFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert(t('invalidFileType'));
      return;
    }

    if (file.size > maxSize) {
      alert(t('fileTooLarge'));
      return;
    }

    setCreateCardForm(prev => ({ ...prev, mediaFile: file }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCreateCardForm(prev => ({ ...prev, mediaPreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, [t]);

  const handleEditMediaFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert(t('invalidFileType'));
      return;
    }

    if (file.size > maxSize) {
      alert(t('fileTooLarge'));
      return;
    }

    setEditCardForm(prev => ({ ...prev, mediaFile: file }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditCardForm(prev => ({ ...prev, mediaPreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, [t]);

  const removeCreateMediaFile = useCallback(() => {
    setCreateCardForm(prev => ({ ...prev, mediaFile: null, mediaPreview: '' }));
  }, []);

  const removeEditMediaFile = useCallback(() => {
    setEditCardForm(prev => ({ ...prev, mediaFile: null, mediaPreview: '' }));
  }, []);

  const exportFlashcards = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      flashcards: flashcards.map(card => ({
        ...card,
        createdAt: card.createdAt.toISOString(),
        lastReviewed: card.lastReviewed?.toISOString(),
        nextReview: card.nextReview.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [flashcards]);

  const importFlashcards = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (!importData.flashcards || !Array.isArray(importData.flashcards)) {
          alert(t('invalidFileFormat'));
          return;
        }

        const importedCards: Flashcard[] = importData.flashcards.map((card: any) => ({
          ...card,
          id: card.id || Date.now().toString() + Math.random(),
          createdAt: new Date(card.createdAt),
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          nextReview: new Date(card.nextReview)
        }));

        // Merge with existing cards, avoiding duplicates
        const existingIds = new Set(flashcards.map(card => card.id));
        const newCards = importedCards.filter(card => !existingIds.has(card.id));

        if (newCards.length === 0) {
          alert(t('noNewCards'));
          return;
        }

        const updatedCards = [...flashcards, ...newCards];
        setFlashcards(updatedCards);

        // Save to workspace database
        for (const card of newCards) {
          await saveCardToDB(card);
        }

        await updateStats(updatedCards);
        alert(t('importSuccess').replace('{count}', newCards.length.toString()));
      } catch (error) {
        alert(t('importError'));
      }
    };

    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  }, [flashcards, updateStats, t]);

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            // Dialog açılırken veya kapanırken form'u temizle
            resetCreateForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('createCard')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewCard')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={createCardForm.type} onValueChange={(value: any) => setCreateCardForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t('textCard')}</SelectItem>
                    <SelectItem value="image">{t('imageCard')}</SelectItem>
                    <SelectItem value="audio">{t('audioCard')}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={t('frontPlaceholder')}
                  value={createCardForm.front}
                  onChange={(e) => setCreateCardForm(prev => ({ ...prev, front: e.target.value }))}
                />

                <Textarea
                  placeholder={t('backPlaceholder')}
                  value={createCardForm.back}
                  onChange={(e) => setCreateCardForm(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                />

                <Input
                  placeholder={t('categoryPlaceholder')}
                  value={createCardForm.category}
                  onChange={(e) => setCreateCardForm(prev => ({ ...prev, category: e.target.value }))}
                />

                <Input
                  placeholder={t('tagsPlaceholder')}
                  value={createCardForm.tags}
                  onChange={(e) => setCreateCardForm(prev => ({ ...prev, tags: e.target.value }))}
                />

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <Label>{t('mediaUpload')}</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {createCardForm.mediaFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {createCardForm.mediaFile.type.startsWith('image/') && <ImageIcon className="w-4 h-4" aria-hidden="true" />}
                            {createCardForm.mediaFile.type.startsWith('audio/') && <Volume2 className="w-4 h-4" />}
                            {createCardForm.mediaFile.type.startsWith('video/') && <Video className="w-4 h-4" />}
                            <span className="text-sm">{createCardForm.mediaFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCreateCardForm(prev => ({ ...prev, mediaFile: null, mediaPreview: '' }))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {createCardForm.mediaPreview && (
                          <div className="mt-2">
                            <img
                              src={createCardForm.mediaPreview}
                              alt="Preview"
                              className="max-w-full max-h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('uploadMedia')}
                        </div>
                        <Input
                          type="file"
                          accept="image/*,audio/*,video/*"
                          onChange={handleCreateMediaFileSelect}
                          className="hidden"
                          id="media-upload"
                        />
                        <Label
                          htmlFor="media-upload"
                          className="cursor-pointer text-primary hover:underline"
                        >
                          {t('chooseFile')}
                        </Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('supportedFormats')}: JPG, PNG, GIF, MP3, WAV, MP4 (max 10MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateCard} className="flex-1">
                    {t('create')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Card Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              // Dialog kapandığında editing state'i temizle
              setEditingCard(null);
              resetEditForm();
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editCard')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={editCardForm.type} onValueChange={(value: any) => setEditCardForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t('textCard')}</SelectItem>
                    <SelectItem value="image">{t('imageCard')}</SelectItem>
                    <SelectItem value="audio">{t('audioCard')}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={t('frontPlaceholder')}
                  value={editCardForm.front}
                  onChange={(e) => setEditCardForm(prev => ({ ...prev, front: e.target.value }))}
                />

                <Textarea
                  placeholder={t('backPlaceholder')}
                  value={editCardForm.back}
                  onChange={(e) => setEditCardForm(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                />

                <Input
                  placeholder={t('categoryPlaceholder')}
                  value={editCardForm.category}
                  onChange={(e) => setEditCardForm(prev => ({ ...prev, category: e.target.value }))}
                />

                <Input
                  placeholder={t('tagsPlaceholder')}
                  value={editCardForm.tags}
                  onChange={(e) => setEditCardForm(prev => ({ ...prev, tags: e.target.value }))}
                />

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <Label>{t('mediaUpload')}</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {editCardForm.mediaFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {editCardForm.mediaFile.type.startsWith('image/') && <ImageIcon className="w-4 h-4" aria-hidden="true" />}
                            {editCardForm.mediaFile.type.startsWith('audio/') && <Volume2 className="w-4 h-4" />}
                            {editCardForm.mediaFile.type.startsWith('video/') && <Video className="w-4 h-4" />}
                            <span className="text-sm">{editCardForm.mediaFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeEditMediaFile}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {editCardForm.mediaPreview && (
                          <div className="mt-2">
                            <img
                              src={editCardForm.mediaPreview}
                              alt="Preview"
                              className="max-w-full max-h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('uploadMedia')}
                        </div>
                        <Input
                          type="file"
                          accept="image/*,audio/*,video/*"
                          onChange={handleEditMediaFileSelect}
                          className="hidden"
                          id="edit-media-upload"
                        />
                        <Label
                          htmlFor="edit-media-upload"
                          className="cursor-pointer text-primary hover:underline"
                        >
                          {t('chooseFile')}
                        </Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('supportedFormats')}: JPG, PNG, GIF, MP3, WAV, MP4 (max 10MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateCard} className="flex-1">
                    {t('update')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {flashcards.length > 0 && (
            <>
              <Button onClick={startStudySession} variant="secondary">
                <Play className="w-4 h-4 mr-2" />
                {t('startStudy')}
              </Button>

              <Button onClick={exportFlashcards} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                {t('exportCards')}
              </Button>

              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={importFlashcards}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-file"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('importCards')}
                  </label>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{t('totalCards')}</p>
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
                <p className="text-sm font-medium">{t('cardsDue')}</p>
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
                <p className="text-sm font-medium">{t('accuracy')}</p>
                <p className="text-2xl font-bold">{Math.round(stats.accuracy)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">{t('studyStreak')}</p>
                <p className="text-2xl font-bold">{stats.studyStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      {stats.totalCards > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('performance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.accuracy)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('accuracy')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(stats.totalStudyTime / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('totalStudyTime')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.studyStreak}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('studyStreak')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageDifficulty.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('averageDifficulty')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Mode */}
      {studyMode && currentCard && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-4">
                <Progress value={(currentCardIndex / flashcards.length) * 100} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {currentCardIndex + 1} / {flashcards.length}
                </p>
              </div>

              <div
                className={`min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="text-center max-w-full">
                  {currentCard.type === 'text' && !currentCard.mediaUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-medium">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </div>
                      {!isFlipped && (
                        <p className="text-muted-foreground">{t('clickToFlip')}</p>
                      )}
                    </div>
                  )}

                  {currentCard.type === 'image' && currentCard.mediaUrl && (
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
                        <p className="text-muted-foreground mt-4">{t('clickToFlip')}</p>
                      )}
                    </div>
                  )}

                  {currentCard.type === 'audio' && currentCard.mediaUrl && (
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
                          {t('audioNotSupported')}
                        </audio>
                      </div>
                      {!isFlipped && (
                        <p className="text-muted-foreground mt-4">{t('clickToFlip')}</p>
                      )}
                    </div>
                  )}

                  {currentCard.type === 'video' && currentCard.mediaUrl && (
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
                          {t('videoNotSupported')}
                        </video>
                      </div>
                      {!isFlipped && (
                        <p className="text-muted-foreground mt-4">{t('clickToFlip')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isFlipped && (
                <div className="mt-8 flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleCardResponse(1)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('hard')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCardResponse(2)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('medium')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCardResponse(3)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('good')}
                  </Button>
                  <Button
                    onClick={() => handleCardResponse(4)}
                    className="flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    {t('easy')}
                  </Button>
                </div>
              )}

              <div className="mt-6 flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentCardIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1))}
                  disabled={currentCardIndex === flashcards.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      {!studyMode && currentSession && (
        <Card className="max-w-md mx-auto mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {t('sessionComplete')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>{t('cardsStudied')}:</span>
                <span className="font-semibold">{currentSession.cardsStudied}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('correctAnswers')}:</span>
                <span className="font-semibold text-green-600">{currentSession.correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('averageTime')}:</span>
                <span className="font-semibold">
                  {Math.round(currentSession.sessionDuration / currentSession.cardsStudied || 0)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('accuracy')}:</span>
                <span className="font-semibold">
                  {Math.round((currentSession.correctAnswers / currentSession.cardsStudied) * 100) || 0}%
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {t('greatJob')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!studyMode && (
        /* Card List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noCards')}</h3>
                <p className="text-muted-foreground mb-4">{t('createFirstCard')}</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createCard')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            flashcards.map((card) => (
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
                      onClick={() => handleEditCard(card)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {card.back}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('nextReview')}: {card.nextReview.toLocaleDateString()}</span>
                    <Badge variant={card.nextReview <= new Date() ? 'destructive' : 'secondary'}>
                      {t('difficulty')}: {card.difficulty}/5
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
