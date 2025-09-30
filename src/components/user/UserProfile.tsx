'use client';

import React, { useState, useEffect, useRef } from 'react';

// Helper function to encode Unicode strings to base64
const encodeToBase64 = (str: string): string => {
  try {
    // Try standard btoa first for Latin1 characters
    return btoa(str);
  } catch (e) {
    // If it fails, encode as UTF-8 bytes then base64
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }
};
import { useAuth } from '@/contexts/AuthContext';
import { useBlockCheck } from '@/hooks/useBlockCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PostCard } from '@/components/content/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Calendar, BookOpen, Users, MessageCircle, Heart, Droplets, Bookmark, UserPlus, UserMinus, Users2 } from 'lucide-react';
import Link from 'next/link';
import { UserControls } from '@/components/moderation/UserControls';

// İngilizce değerler (veritabanında saklanan)
const GRADES_EN = [
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade (Freshman)',
  '10th Grade (Sophomore)',
  '11th Grade (Junior)',
  '12th Grade (Senior)',
  'Undergraduate',
  'Graduate',
  'Other',
];

// Türkçe değerler (görüntülenen)
const GRADES_TR = [
  '6. Sınıf',
  '7. Sınıf',
  '8. Sınıf',
  '9. Sınıf (Lise 1)',
  '10. Sınıf (Lise 2)',
  '11. Sınıf (Lise 3)',
  '12. Sınıf (Lise 4)',
  'Üniversite',
  'Mezun',
  'Diğer',
];

// İngilizce değerler (veritabanında saklanan)
const SUBJECTS_EN = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Literature',
  'Art',
  'Music',
  'Physical Education',
  'Foreign Language',
  'Economics',
  'Psychology',
  'Sociology',
  'Philosophy',
  'Other',
];

// Türkçe değerler (görüntülenen)
const SUBJECTS_TR = [
  'Matematik',
  'Fen Bilimleri',
  'İngilizce',
  'Tarih',
  'Coğrafya',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Bilgisayar Bilimi',
  'Edebiyat',
  'Sanat',
  'Müzik',
  'Beden Eğitimi',
  'Yabancı Dil',
  'Ekonomi',
  'Psikoloji',
  'Sosyoloji',
  'Felsefe',
  'Diğer',
];

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
    likes: number;
    pools: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  subject?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    school?: string;
    grade?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

interface UserProfileProps {
  userId?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const { user, dbUser, isGuest } = useAuth();
  const t = useTranslations();
  const trRoles = useTranslations('roles');
  const locale = useLocale();
  const { isBlocked, isLoading: blockLoading } = useBlockCheck(userId || '');
  
  // Fallback locale if useLocale fails
  const currentLocale = locale || 'en';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [unblockingUsers, setUnblockingUsers] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'STUDENT',
    school: '',
    grade: '',
    favoriteSubject: '',
    bio: '',
    avatar: '' as string | undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const isOwnProfile = !userId || userId === dbUser?.id;

  const fetchProfile = async () => {
    try {
      const targetUserId = userId || dbUser?.id;
      
      if (!targetUserId || !user) {
        return;
      }

      const response = await fetch(`/api/users?userId=${targetUserId}`, {
        headers: {
          ...(user?.email ? { 'x-user-email': encodeToBase64(user.email) } : {}),
          ...(dbUser?.name ? { 'x-user-name': encodeToBase64(dbUser.name) } : {}),
        },
      });
      let data;
      if (!response.ok) {
        // Fallback: try by email in dev, server will upsert if needed
        if (user?.email) {
          const byEmail = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`, {
            headers: {
              'x-user-email': encodeToBase64(user.email),
              ...(dbUser?.name ? { 'x-user-name': encodeToBase64(dbUser.name) } : {}),
            },
          });
          if (!byEmail.ok) {
            throw new Error('Failed to fetch profile');
          }
          data = await byEmail.json();
        } else {
          throw new Error('Failed to fetch profile');
        }
      } else {
        data = await response.json();
      }
      setProfile(data);
      
      // Initialize edit form - Grade ve Subject alanlarını doğru şekilde ayarla
      // Eğer grade alanında subject değeri varsa, bunu düzelt
      let correctedGrade = data.grade || '';
      let correctedSubject = data.favoriteSubject || '';
      
      // Grade alanında subject değeri varsa, bunu düzelt
      if (correctedGrade && SUBJECTS_EN.includes(correctedGrade)) {
        correctedSubject = correctedGrade;
        correctedGrade = '';
      }
      
      setEditForm({
        name: data.name || '',
        role: data.role || 'STUDENT',
        school: data.school || '',
        grade: correctedGrade,
        favoriteSubject: correctedSubject,
        bio: data.bio || '',
        avatar: data.avatar || undefined,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.updateError'),
        variant: "destructive",
      });
    }
  };

  const fetchUserPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const targetUserId = userId || dbUser?.id;
      if (!targetUserId || !user) return;

      const response = await fetch(
        `/api/users/posts?userId=${targetUserId}&page=${pageNum}&limit=6`,
        {
          headers: {
            ...(user?.email ? { 'x-user-email': encodeToBase64(user.email) } : {}),
            ...(dbUser?.name ? { 'x-user-name': encodeToBase64(dbUser.name) } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.email ? { 'x-user-email': encodeToBase64(user.email) } : {}),
          ...(dbUser?.name ? { 'x-user-name': encodeToBase64(dbUser.name) } : {}),
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      setIsEditing(false);
      
      toast({
        title: t('common.success'),
        description: t('profile.updateSuccess'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.updateError'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadMorePosts = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUserPosts(nextPage, true);
  };

  const checkFollowStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;
    
    try {
      const response = await fetch(`/api/follow/${profile.id}/status`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkBlockStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;
    
    try {
      const response = await fetch('/api/blocks');
      if (response.ok) {
        const data = await response.json();
        const isUserBlocked = data.blockedUsers.some((block: any) => block.blockedId === profile.id);
        setIsBlockedByMe(isUserBlocked);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const checkMuteStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;

    try {
      const response = await fetch('/api/mutes');
      if (response.ok) {
        const data = await response.json();
        const isUserMuted = data.mutedUsers.some((mute: any) => mute.mutedId === profile.id);
        setIsMuted(isUserMuted);
      }
    } catch (error) {
      console.error('Error checking mute status:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    if (isGuest) return;

    try {
      const response = await fetch('/api/blocks');
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const unblockUser = async (blockedUserId: string) => {
    // Start unblocking animation
    setUnblockingUsers(prev => new Set(prev).add(blockedUserId));

    try {
      const response = await fetch(`/api/blocks/${blockedUserId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        setBlockedUsers(prev => prev.filter(user => user.blockedId !== blockedUserId));
        toast({
          title: t('common.success'),
          description: t('profile.unblockedSuccessfully'),
        });
      } else {
        throw new Error('Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: t('common.error'),
        description: t('profile.unblockError'),
        variant: "destructive",
      });
    } finally {
      // Remove from unblocking state
      setUnblockingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockedUserId);
        return newSet;
      });
    }
  };

  const handleFollowUnfollow = async () => {
    if (!profile || isGuest) return;
    
    setFollowLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followingId: profile.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to follow/unfollow');
      }

      const data = await response.json();
      setIsFollowing(data.following);
      
      // Update follower count
      if (profile) {
        setProfile(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            followers: data.following ? prev._count.followers + 1 : prev._count.followers - 1
          }
        } : null);
      }

      toast({
        title: data.following ? t('common.follow') : t('common.unfollow'),
        description: data.following 
          ? `${profile.name || t('common.user')} ${t('notifications.notificationTypes.follow')}`
          : `${profile.name || t('common.user')} ${t('common.unfollow')}`,
      });
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProfile(), fetchUserPosts(1, false)]);
      setIsLoading(false);
    };

    // Clear profile data when user logs out
    if (isGuest || !user) {
      setProfile(null);
      setPosts([]);
      setIsLoading(false);
      return;
    }

    if (!isGuest && user) {
      loadData();
    }
  }, [userId, dbUser, isGuest, user]);

  useEffect(() => {
    if (profile && !isOwnProfile && !isGuest) {
      checkFollowStatus();
      checkBlockStatus();
      checkMuteStatus();
    }
  }, [profile, isOwnProfile, isGuest]);

  useEffect(() => {
    if (isOwnProfile && !isGuest && user) {
      fetchBlockedUsers();
    }
  }, [isOwnProfile, isGuest, user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // İngilizce değerleri dil ayarına göre çevir
  const translateGrade = (gradeEn: string): string => {
    if (!gradeEn) return '';
    const index = GRADES_EN.indexOf(gradeEn);
    if (index === -1) return gradeEn;
    
    try {
      return currentLocale === 'tr' ? GRADES_TR[index] : GRADES_EN[index];
    } catch (error) {
      return gradeEn;
    }
  };

  const translateSubject = (subjectEn: string): string => {
    if (!subjectEn) return '';
    const index = SUBJECTS_EN.indexOf(subjectEn);
    if (index === -1) return subjectEn;
    
    try {
      return currentLocale === 'tr' ? SUBJECTS_TR[index] : SUBJECTS_EN[index];
    } catch (error) {
      return subjectEn;
    }
  };

  const onAvatarClick = () => fileInputRef.current?.click();
  const onAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: 'Please select a valid image file',
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'Image size must be less than 5MB',
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      
      // Update local state immediately for UI feedback
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
      setProfile(prev => prev ? { ...prev, avatar: dataUrl } : prev);
      
      // Auto-save the avatar to database
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.email ? { 'x-user-email': encodeToBase64(user.email) } : {}),
            ...(dbUser?.name ? { 'x-user-name': encodeToBase64(dbUser.name) } : {}),
          },
          body: JSON.stringify({
            name: editForm.name,
            role: editForm.role,
            school: editForm.school,
            grade: editForm.grade,
            favoriteSubject: editForm.favoriteSubject,
            bio: editForm.bio,
            avatar: dataUrl,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save avatar');
        }

        const updatedProfile = await response.json();
        
        toast({
          title: t('common.success'),
          description: 'Profile picture updated successfully',
        });
      } catch (error) {
        console.error('Error saving avatar:', error);
        toast({
          title: t('common.error'),
          description: 'Failed to save profile picture',
          variant: "destructive",
        });
        
        // Revert the UI change if save failed
        setEditForm(prev => ({ ...prev, avatar: profile?.avatar }));
        setProfile(prev => prev ? { ...prev, avatar: profile?.avatar } : prev);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = t(`userProfile.months.${date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()}`);
    const day = date.getDate();
    const year = date.getFullYear();
    return t('userProfile.dateFormat', { month, day, year });
  };

  // Show blocked message if user is blocked
  if (isBlocked && !blockLoading && !isOwnProfile) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('common.blocked')}</h3>
              <p className="text-muted-foreground">
                {t('profile.blockedMessage')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-8 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('common.user')} {t('errors.notFound')}</h3>
              <p className="text-muted-foreground">
                {t('common.user')} {t('errors.notFound')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={onAvatarClick}>
                {/* Main profile avatar: Show user's uploaded image only when they have uploaded one */}
                {/* After Google signup, show default empty image until user uploads their own image */}
                <AvatarImage 
                  src={profile.avatar || undefined} 
                  alt={profile.name || 'User'} 
                />
                <AvatarFallback className="text-2xl">
                  {profile.name ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      {profile.name || t('common.anonymousUser')}
                    </h1>
                    {/* Email removed from display - only used for authentication */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t('userProfile.joinedOn', { date: formatDate(profile.createdAt) })}</span>
                    </div>
                  </div>
                  
                  {isOwnProfile ? (
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('profile.editProfile')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
                          <DialogDescription>
                            {t('profile.basicInfo')}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">{t('profile.displayName')}</label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder={t('profile.displayName')}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">{t('settings.roleLabel')}</label>
                            <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('settings.rolePlaceholder')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STUDENT">{trRoles('STUDENT')}</SelectItem>
                                <SelectItem value="TEACHER">{trRoles('TEACHER')}</SelectItem>
                                <SelectItem value="ACADEMICIAN">{trRoles('ACADEMICIAN')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">{t('profile.school')}</label>
                            <Input
                              value={editForm.school}
                              onChange={(e) => setEditForm(prev => ({ ...prev, school: e.target.value }))}
                              placeholder={t('profile.school')}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">{t('profile.grade')}</label>
                            <Select value={editForm.grade} onValueChange={(value) => setEditForm(prev => ({ ...prev, grade: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profile.grade')}>
                                  {editForm.grade ? translateGrade(editForm.grade) : ''}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(currentLocale === 'tr' ? GRADES_TR : GRADES_EN).map((grade, index) => (
                                  <SelectItem key={grade} value={GRADES_EN[index]}>
                                    {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">{t('profile.favoriteSubjects')}</label>
                            <Select value={editForm.favoriteSubject} onValueChange={(value) => setEditForm(prev => ({ ...prev, favoriteSubject: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profile.favoriteSubjects')}>
                                  {editForm.favoriteSubject ? translateSubject(editForm.favoriteSubject) : ''}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(currentLocale === 'tr' ? SUBJECTS_TR : SUBJECTS_EN).map((subject, index) => (
                                  <SelectItem key={subject} value={SUBJECTS_EN[index]}>
                                    {subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">{t('profile.bio')}</label>
                            <Textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                              placeholder={t('userProfile.bioPlaceholder')}
                              rows={3}
                              maxLength={200}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {editForm.bio.length}/200 {t('common.characters')}
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                              <X className="h-4 w-4 mr-2" />
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                              <Save className="h-4 w-4 mr-2" />
                              {isSaving ? t('common.loading') : t('common.save')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleFollowUnfollow} 
                        disabled={followLoading || isGuest}
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                      >
                        {followLoading ? (
                          t('common.loading')
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            {t('common.unfollow')}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('common.follow')}
                          </>
                        )}
                      </Button>
                      
                      <UserControls
                        targetUserId={profile.id}
                        targetUserName={profile.name || t('common.user')}
                        isBlocked={isBlockedByMe}
                        isMuted={isMuted}
                        onBlockChange={setIsBlockedByMe}
                        onMuteChange={setIsMuted}
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">More options</span>
                        </Button>
                      </UserControls>
                    </div>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="space-y-3">
                  {profile.role && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('userProfile.roleLabel')}</span>
                      <Badge variant="secondary">{trRoles(profile.role as any)}</Badge>
                    </div>
                  )}
                  {profile.school && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('userProfile.schoolLabel')}</span>
                      <Badge variant="secondary">{profile.school}</Badge>
                    </div>
                  )}
                  
                  {profile.grade && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('userProfile.gradeLabel')}</span>
                      <Badge variant="outline">{translateGrade(profile.grade)}</Badge>
                    </div>
                  )}
                  
                  {profile.favoriteSubject && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('userProfile.favoriteSubjectLabel')}</span>
                      <Badge variant="default">{translateSubject(profile.favoriteSubject)}</Badge>
                    </div>
                  )}
                  
                  {profile.bio && (
                    <div>
                      <span className="font-medium">{t('userProfile.bioLabel')}</span>
                      <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.posts}</div>
              <div className="text-sm text-muted-foreground">{t('common.posts')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.comments}</div>
              <div className="text-sm text-muted-foreground">{t('comments.comments')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.followers}</div>
              <div className="text-sm text-muted-foreground">{t('common.followers')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.following}</div>
              <div className="text-sm text-muted-foreground">{t('following.title')}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(isOwnProfile || isFollowing) && (
            <Link href={`/${currentLocale}/profile/likes`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent">
              <Heart className="h-4 w-4" />
              <span>Likes</span>
            </Link>
          )}
          {(isOwnProfile || isFollowing) && (
            <Link href={`/${currentLocale}/profile/comments`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent">
              <MessageCircle className="h-4 w-4" />
              <span>Comments</span>
            </Link>
          )}
          {isOwnProfile && (
            <Link href={`/${currentLocale}/saved`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent">
              <Droplets className="h-4 w-4" />
              <span>Pool</span>
            </Link>
          )}
          {isOwnProfile && (
            <Button
              variant="outline"
              onClick={() => setShowBlockedUsers(true)}
              className="inline-flex items-center gap-2 px-3 py-2"
            >
              <Users2 className="h-4 w-4" />
              <span>Blocked ({blockedUsers.length})</span>
            </Button>
          )}
        </div>

        {/* User Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isOwnProfile ? t('userProfile.yourPosts') : `${profile.name || t('common.user')} ${t('common.posts')}`}
          </h2>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('posts.noPosts')}</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile ? t('home.beFirst') : t('posts.noPosts')}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => window.location.href = '/'}>
                    {t('home.createFirstPost')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-[5px]" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
              }}>
                {posts.map((post) => (
                  <div key={post.id} className="h-fit">
                    <PostCard
                      post={post}
                      currentUserId={dbUser?.id}
                    />
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button onClick={loadMorePosts}>
                    {t('posts.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Blocked Users Modal */}
        <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                {t('profile.blockedUsers')}
              </DialogTitle>
              <DialogDescription>
                {t('profile.blockedUsersDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{t('profile.noBlockedUsers')}</h3>
                  <p className="text-muted-foreground">
                    {t('profile.noBlockedUsersDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map((blockedUser) => {
                    const isUnblocking = unblockingUsers.has(blockedUser.blockedId);

                    return (
                      <div
                        key={blockedUser.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                          isUnblocking ? 'opacity-75 scale-98' : 'opacity-100 scale-100'
                        }`}
                      >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={blockedUser.blocked.avatar} alt={blockedUser.blocked.name} />
                          <AvatarFallback>
                            {blockedUser.blocked.name ? getInitials(blockedUser.blocked.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{blockedUser.blocked.name || t('common.anonymousUser')}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('profile.blockedOn')} {new Date(blockedUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockUser(blockedUser.blockedId)}
                        disabled={unblockingUsers.has(blockedUser.blockedId)}
                        className={`transition-all duration-300 ${
                          unblockingUsers.has(blockedUser.blockedId)
                            ? 'bg-green-50 border-green-200 text-green-700 animate-pulse'
                            : 'hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                        }`}
                      >
                        {unblockingUsers.has(blockedUser.blockedId) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('profile.unblocking')}</span>
                          </div>
                        ) : (
                          t('profile.unblock')
                        )}
                      </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};