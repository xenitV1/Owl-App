'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Plus, Edit, Trash2, FolderOpen, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PoolCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  _count: {
    pools: number;
  };
}

interface PoolManagementProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
  totalItemsCount?: number;
}

const ICON_OPTIONS = [
  { value: 'Bookmark', label: 'Bookmark' },
  { value: 'BookOpen', label: 'Book' },
  { value: 'FolderOpen', label: 'Folder' },
  { value: 'Star', label: 'Star' },
  { value: 'Heart', label: 'Heart' },
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'Lightbulb', label: 'Lightbulb' },
  { value: 'Target', label: 'Target' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'Award', label: 'Award' },
];

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue', color: 'bg-blue-500' },
  { value: '#EF4444', label: 'Red', color: 'bg-red-500' },
  { value: '#10B981', label: 'Green', color: 'bg-green-500' },
  { value: '#F59E0B', label: 'Yellow', color: 'bg-yellow-500' },
  { value: '#8B5CF6', label: 'Purple', color: 'bg-purple-500' },
  { value: '#EC4899', label: 'Pink', color: 'bg-pink-500' },
  { value: '#6B7280', label: 'Gray', color: 'bg-gray-500' },
  { value: '#14B8A6', label: 'Teal', color: 'bg-teal-500' },
];

export default function PoolManagement({ onCategorySelect, selectedCategoryId, totalItemsCount }: PoolManagementProps) {
  const t = useTranslations('saved');
  const [categories, setCategories] = useState<PoolCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PoolCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'Bookmark'
  });
  const { user } = useAuth();

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
    } as Record<string, string>;
  };

  const fetchCategories = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/pool-categories', { headers });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/pool-categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: 'Bookmark'
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/pool-categories/${editingCategory.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        setEditingCategory(null);
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: 'Bookmark'
        });
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Items will be moved to uncategorized.')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/pool-categories/${categoryId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchCategories();
        if (selectedCategoryId === categoryId && onCategorySelect) {
          onCategorySelect(null);
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEditCategory = (category: PoolCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="h-5 w-5" />;
      case 'FolderOpen': return <FolderOpen className="h-5 w-5" />;
      default: return <Droplets className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            {t('myCollections')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              {t('myCollections')}
            </CardTitle>
            <CardDescription>
              {t('organizeMaterials')}
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('newCollection')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewCollection')}</DialogTitle>
                <DialogDescription>
                  {t('createCollectionDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('collectionName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('collectionNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('descriptionOptional')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">{t('icon')}</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">{t('color')}</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!formData.name}>
                    {t('createCollection')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Uncategorized */}
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedCategoryId === null ? 'bg-primary/10 border-primary' : 'border-gray-200'
            }`}
            onClick={() => onCategorySelect?.(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium">{t('allSavedItems')}</div>
                  <div className="text-sm text-gray-500">
                    {totalItemsCount || 0} {t('items')}
                  </div>
                </div>
              </div>
              {selectedCategoryId === null && (
                <Badge variant="default">{t('selected')}</Badge>
              )}
            </div>
          </div>

          {/* Categories */}
          {categories.map((category) => (
            <div
              key={category.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedCategoryId === category.id ? 'bg-primary/10 border-primary' : 'border-gray-200'
              }`}
              onClick={() => onCategorySelect?.(category.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <div style={{ color: category.color }}>
                      {getIconComponent(category.icon)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category._count.pools} {t('items')}
                      {category.description && ` • ${category.description}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCategoryId === category.id && (
                    <Badge variant="default">{t('selected')}</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('noCollectionsYet')}</p>
              <p className="text-sm">{t('createFirstCollection')}</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editCollection')}</DialogTitle>
            <DialogDescription>
              {t('updateCollectionDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('collectionName')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('descriptionOptional')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">{t('icon')}</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-color">{t('color')}</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateCategory} disabled={!formData.name}>
                {t('updateCollection')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}