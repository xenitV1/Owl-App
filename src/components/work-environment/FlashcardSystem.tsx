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
import {
  Plus,
  Play,
  RotateCcw,
  TrendingUp,
  Brain,
  Clock,
  Target,
  FileText,
  Image,
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
}

interface FlashcardStats {
  totalCards: number;
  cardsDue: number;
  averageDifficulty: number;
  studyStreak: number;
  totalStudyTime: number;
  accuracy: number;
}

export default function FlashcardSystem() {
  const t = useTranslations('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [stats, setStats] = useState<FlashcardStats>({
    totalCards: 0,
    cardsDue: 0,
    averageDifficulty: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    accuracy: 0
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [newCard, setNewCard] = useState({
    front: '',
    back: '',
    type: 'text' as 'text' | 'image' | 'audio' | 'video',
    category: '',
    tags: '',
    mediaFile: null as File | null,
    mediaPreview: '' as string
  });

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

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open('FlashcardSystem', 1);

      request.onerror = () => console.error('IndexedDB error');

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        loadFlashcards(db);
        loadStats(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('flashcards')) {
          const store = db.createObjectStore('flashcards', { keyPath: 'id' });
          store.createIndex('nextReview', 'nextReview');
          store.createIndex('category', 'category');
        }

        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };
    };

    initDB();
  }, []);

  const loadFlashcards = useCallback((db: IDBDatabase) => {
    const transaction = db.transaction(['flashcards'], 'readonly');
    const store = transaction.objectStore('flashcards');
    const request = store.getAll();

    request.onsuccess = () => {
      const cards = request.result.map(card => ({
        ...card,
        nextReview: new Date(card.nextReview),
        createdAt: new Date(card.createdAt),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined
      }));
      setFlashcards(cards);
      updateStats(cards);
    };
  }, []);

  const loadStats = useCallback((db: IDBDatabase) => {
    const transaction = db.transaction(['stats'], 'readonly');
    const store = transaction.objectStore('stats');
    const request = store.get('main');

    request.onsuccess = () => {
      if (request.result) {
        setStats(request.result);
      }
    };
  }, []);

  const updateStats = useCallback((cards: Flashcard[]) => {
    const now = new Date();
    const cardsDue = cards.filter(card => card.nextReview <= now).length;
    const averageDifficulty = cards.length > 0
      ? cards.reduce((sum, card) => sum + card.difficulty, 0) / cards.length
      : 0;

    setStats(prev => ({
      ...prev,
      totalCards: cards.length,
      cardsDue,
      averageDifficulty
    }));
  }, []);

  const saveCardToDB = useCallback((card: Flashcard) => {
    const request = indexedDB.open('FlashcardSystem', 1);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['flashcards'], 'readwrite');
      const store = transaction.objectStore('flashcards');
      store.put(card);
    };
  }, []);

  const getMediaTypeFromFile = useCallback((file: File): 'image' | 'audio' | 'video' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'image'; // fallback
  }, []);

  const handleCreateCard = useCallback(async () => {
    if (!newCard.front.trim() || !newCard.back.trim()) return;

    let mediaUrl = '';

    // Handle media file if present
    if (newCard.mediaFile) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      mediaUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(newCard.mediaFile as Blob);
      });
    }

    const card: Flashcard = {
      id: Date.now().toString(),
      front: newCard.front,
      back: newCard.back,
      type: newCard.mediaFile ? getMediaTypeFromFile(newCard.mediaFile) : newCard.type,
      mediaUrl: mediaUrl || undefined,
      difficulty: 3,
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: new Date(),
      tags: newCard.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: newCard.category
    };

    const updatedCards = [...flashcards, card];
    setFlashcards(updatedCards);
    saveCardToDB(card);
    updateStats(updatedCards);

    setNewCard({ front: '', back: '', type: 'text', category: '', tags: '', mediaFile: null, mediaPreview: '' });
    setIsCreateDialogOpen(false);
  }, [newCard, flashcards, saveCardToDB, updateStats, getMediaTypeFromFile]);

  const handleEditCard = useCallback((card: Flashcard) => {
    setEditingCard(card);
    setNewCard({
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
    if (!editingCard || !newCard.front.trim() || !newCard.back.trim()) return;

    let mediaUrl = editingCard.mediaUrl || '';

    // Handle new media file if present
    if (newCard.mediaFile) {
      const reader = new FileReader();
      mediaUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(newCard.mediaFile as Blob);
      });
    }

    const updatedCard: Flashcard = {
      ...editingCard,
      front: newCard.front,
      back: newCard.back,
      type: newCard.mediaFile ? getMediaTypeFromFile(newCard.mediaFile) : newCard.type,
      mediaUrl: mediaUrl || undefined,
      tags: newCard.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: newCard.category
    };

    const updatedCards = flashcards.map(card =>
      card.id === editingCard.id ? updatedCard : card
    );

    setFlashcards(updatedCards);
    saveCardToDB(updatedCard);
    updateStats(updatedCards);

    setNewCard({ front: '', back: '', type: 'text', category: '', tags: '', mediaFile: null, mediaPreview: '' });
    setEditingCard(null);
    setIsEditDialogOpen(false);
  }, [editingCard, newCard, flashcards, saveCardToDB, updateStats, getMediaTypeFromFile]);

  const handleDeleteCard = useCallback((cardId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    const updatedCards = flashcards.filter(card => card.id !== cardId);
    setFlashcards(updatedCards);

    // Remove from IndexedDB
    const request = indexedDB.open('FlashcardSystem', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['flashcards'], 'readwrite');
      const store = transaction.objectStore('flashcards');
      store.delete(cardId);
    };

    updateStats(updatedCards);
  }, [flashcards, t, updateStats]);

  const saveSessionToDB = useCallback((session: StudySession) => {
    const request = indexedDB.open('FlashcardSystem', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      store.put(session);
    };
  }, []);

  const handleCardResponse = useCallback((quality: number) => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    const updatedCard = calculateNextReview(currentCard, quality);
    const updatedCards = flashcards.map(card =>
      card.id === currentCard.id ? updatedCard : card
    );

    setFlashcards(updatedCards);
    saveCardToDB(updatedCard);
    updateStats(updatedCards);

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
        saveSessionToDB(finalSession);

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
      sessionDuration: 0
    };

    setCurrentSession(session);
    setFlashcards(sortedCards);
    setCurrentCardIndex(0);
    setStudyMode(true);
    setIsFlipped(false);
  }, [flashcards]);

  const handleMediaFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

    setNewCard(prev => ({ ...prev, mediaFile: file }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewCard(prev => ({ ...prev, mediaPreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, [t]);

  const removeMediaFile = useCallback(() => {
    setNewCard(prev => ({ ...prev, mediaFile: null, mediaPreview: '' }));
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

  const importFlashcards = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
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

        // Save to database
        const request = indexedDB.open('FlashcardSystem', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['flashcards'], 'readwrite');
          const store = transaction.objectStore('flashcards');

          newCards.forEach(card => {
            store.put(card);
          });
        };

        updateStats(updatedCards);
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <Select value={newCard.type} onValueChange={(value: any) => setNewCard(prev => ({ ...prev, type: value }))}>
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
                  value={newCard.front}
                  onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                />

                <Textarea
                  placeholder={t('backPlaceholder')}
                  value={newCard.back}
                  onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                />

                <Input
                  placeholder={t('categoryPlaceholder')}
                  value={newCard.category}
                  onChange={(e) => setNewCard(prev => ({ ...prev, category: e.target.value }))}
                />

                <Input
                  placeholder={t('tagsPlaceholder')}
                  value={newCard.tags}
                  onChange={(e) => setNewCard(prev => ({ ...prev, tags: e.target.value }))}
                />

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <Label>{t('mediaUpload')}</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {newCard.mediaFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {newCard.mediaFile.type.startsWith('image/') && <Image className="w-4 h-4" aria-hidden="true" />}
                            {newCard.mediaFile.type.startsWith('audio/') && <Volume2 className="w-4 h-4" />}
                            {newCard.mediaFile.type.startsWith('video/') && <Video className="w-4 h-4" />}
                            <span className="text-sm">{newCard.mediaFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeMediaFile}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {newCard.mediaPreview && (
                          <div className="mt-2">
                            <img
                              src={newCard.mediaPreview}
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
                          onChange={handleMediaFileSelect}
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
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Card Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editCard')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={newCard.type} onValueChange={(value: any) => setNewCard(prev => ({ ...prev, type: value }))}>
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
                  value={newCard.front}
                  onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                />

                <Textarea
                  placeholder={t('backPlaceholder')}
                  value={newCard.back}
                  onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                />

                <Input
                  placeholder={t('categoryPlaceholder')}
                  value={newCard.category}
                  onChange={(e) => setNewCard(prev => ({ ...prev, category: e.target.value }))}
                />

                <Input
                  placeholder={t('tagsPlaceholder')}
                  value={newCard.tags}
                  onChange={(e) => setNewCard(prev => ({ ...prev, tags: e.target.value }))}
                />

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <Label>{t('mediaUpload')}</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {newCard.mediaFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {newCard.mediaFile.type.startsWith('image/') && <Image className="w-4 h-4" aria-hidden="true" />}
                            {newCard.mediaFile.type.startsWith('audio/') && <Volume2 className="w-4 h-4" />}
                            {newCard.mediaFile.type.startsWith('video/') && <Video className="w-4 h-4" />}
                            <span className="text-sm">{newCard.mediaFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeMediaFile}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {newCard.mediaPreview && (
                          <div className="mt-2">
                            <img
                              src={newCard.mediaPreview}
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
                          onChange={handleMediaFileSelect}
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
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
                        <Image className="w-6 h-6" aria-hidden="true" />
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
