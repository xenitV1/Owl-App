'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, FolderOpen, Bookmark, Trash2, Edit } from 'lucide-react';

interface PoolCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface PoolItemActionsProps {
  postId: string;
  currentCategoryId?: string | null;
  categories: PoolCategory[];
  onMoveToCategory: (postId: string, categoryId: string | null) => void;
  onRemove: (postId: string) => void;
}

export default function PoolItemActions({
  postId,
  currentCategoryId,
  categories,
  onMoveToCategory,
  onRemove
}: PoolItemActionsProps) {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(currentCategoryId || null);

  const handleMove = () => {
    onMoveToCategory(postId, selectedCategoryId);
    setIsMoveDialogOpen(false);
  };

  const getCurrentCategory = () => {
    if (!currentCategoryId) return null;
    return categories.find(cat => cat.id === currentCategoryId);
  };

  const currentCategory = getCurrentCategory();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Move to Collection
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Move to Collection</DialogTitle>
                <DialogDescription>
                  Choose a collection to move this item to, or select "Uncategorized" to remove it from any collection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Collection</label>
                  <Select value={selectedCategoryId || 'uncategorized'} onValueChange={(value) => setSelectedCategoryId(value === 'uncategorized' ? null : value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4" />
                          Uncategorized
                        </div>
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMove}>
                    Move
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <DropdownMenuItem onClick={() => onRemove(postId)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from Saved
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Current Category Badge */}
      {currentCategory && (
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{ 
            backgroundColor: currentCategory.color + '20',
            color: currentCategory.color 
          }}
        >
          {currentCategory.name}
        </Badge>
      )}
    </>
  );
}