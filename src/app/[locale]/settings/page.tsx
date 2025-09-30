'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Palette, Type, Bell, Shield, Save, ArrowLeft } from 'lucide-react';

const GRADES = [
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', 
  '11th Grade', '12th Grade', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'
];

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 
  'Chemistry', 'Biology', 'Computer Science', 'Literature', 'Art', 'Music',
  'Physical Education', 'Foreign Language', 'Economics', 'Psychology', 'Sociology', 'Philosophy', 'Other'
];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tr = useTranslations('roles');
  const { loading, isGuest, user, dbUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    school: '',
    grade: '',
    favoriteSubject: '',
    role: '',
    emailNotifications: true,
    pushNotifications: true
  });

  useEffect(() => {
    if (!loading && !isGuest && user) {
      // Load user data
      const loadUserData = async () => {
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              ...(user?.email ? { 'x-user-email': user.email } : {}),
              ...(dbUser?.name ? { 'x-user-name': dbUser.name } : {}),
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setFormData({
              name: userData.name || '',
              bio: userData.bio || '',
              school: userData.school || '',
              grade: userData.grade || '',
              favoriteSubject: userData.favoriteSubject || '',
              role: userData.role || '',
              emailNotifications: true, // Default values
              pushNotifications: true
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };
      loadUserData();
    }
  }, [loading, isGuest, user]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.email ? { 'x-user-email': user.email } : {}),
          ...(dbUser?.name ? { 'x-user-name': dbUser.name } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Sign in to access settings</h3>
              <p className="text-muted-foreground mb-4">
                Create an account to customize your experience and manage your preferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  {/* Settings page avatar: Show user's uploaded image only when they have uploaded one */}
                  {/* After Google signup, show default empty image until user uploads their own image */}
                  <AvatarImage src={undefined} alt={dbUser?.name || 'User'} />
                  <AvatarFallback className="text-lg">
                    {dbUser?.name ? getInitials(dbUser.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{dbUser?.name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    Student
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium capitalize">{theme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Font Size:</span>
                  <span className="font-medium capitalize">{fontSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School:</span>
                  <span className="font-medium">{formData.school || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade:</span>
                  <span className="font-medium">{formData.grade || 'Not set'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profileInformation')}</CardTitle>
              <CardDescription>
                {t('profileInformationDescription')}
              <div>
                <Label htmlFor="role">{t('roleLabel')}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">{tr('STUDENT')}</SelectItem>
                    <SelectItem value="TEACHER">{tr('TEACHER')}</SelectItem>
                    <SelectItem value="ACADEMICIAN">{tr('ACADEMICIAN')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="Your school name"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="favoriteSubject">Favorite Subject</Label>
                <Select value={formData.favoriteSubject} onValueChange={(value) => setFormData({ ...formData, favoriteSubject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your favorite subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Theme</Label>
                <div className="grid gap-2 mt-2">
                  {(['light', 'dark', 'system', 'retro-light', 'retro-dark'] as const).map((themeOption) => (
                    <div
                      key={themeOption}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        theme === themeOption ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setTheme(themeOption)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          theme === themeOption ? 'border-primary' : 'border-border'
                        }`}>
                          {theme === themeOption && (
                            <div className="w-2 h-2 rounded-full bg-primary m-0.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-medium">
                            {themeOption === 'retro-light' ? 'Retro Light' : 
                             themeOption === 'retro-dark' ? 'Retro Dark' : 
                             themeOption}
                          </span>
                          {themeOption.startsWith('retro-') && (
                            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                              ✦ Retro
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Font Size</Label>
                <div className="grid gap-2 mt-2">
                  {(['small', 'normal', 'large'] as const).map((sizeOption) => (
                    <div
                      key={sizeOption}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        fontSize === sizeOption ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setFontSize(sizeOption)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          fontSize === sizeOption ? 'border-primary' : 'border-border'
                        }`}>
                          {fontSize === sizeOption && (
                            <div className="w-2 h-2 rounded-full bg-primary m-0.5" />
                          )}
                        </div>
                        <span className="capitalize font-medium">{sizeOption}</span>
                      </div>
                      <span className={`text-muted-foreground ${
                        sizeOption === 'small' ? 'text-sm' : 
                        sizeOption === 'large' ? 'text-lg' : 'text-base'
                      }`}>
                        Aa
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your activity
                  </p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={formData.pushNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, pushNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div>
              {saveMessage && (
                <p className={`text-sm ${
                  saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {saveMessage}
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}