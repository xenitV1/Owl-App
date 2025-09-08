'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
// Note: Using string literals to avoid Prisma client issues
type FilterType = 'KEYWORD' | 'PATTERN' | 'URL' | 'EMAIL' | 'PHONE';
type FilterAction = 'FLAG' | 'BLOCK' | 'REMOVE' | 'ESCALATE';

interface ContentFilter {
  id: string;
  type: FilterType;
  pattern: string;
  action: FilterAction;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  type: FilterType;
  pattern: string;
  action: FilterAction;
  isActive: boolean;
  description: string;
}

export function ContentFilterManager() {
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<ContentFilter | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: 'KEYWORD',
    pattern: '',
    action: 'FLAG',
    isActive: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await fetch('/api/content-filters');
      if (response.ok) {
        const data = await response.json();
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Error fetching content filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingFilter ? `/api/content-filters/${editingFilter.id}` : '/api/content-filters';
      const method = editingFilter ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save filter');
      }

      setSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
        resetForm();
        fetchFilters();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (filter: ContentFilter) => {
    setEditingFilter(filter);
    setFormData({
      type: filter.type,
      pattern: filter.pattern,
      action: filter.action,
      isActive: filter.isActive,
      description: filter.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (filterId: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) return;

    try {
      const response = await fetch(`/api/content-filters/${filterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete filter');
      }

      fetchFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const handleToggleActive = async (filterId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/content-filters/${filterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update filter');
      }

      fetchFilters();
    } catch (error) {
      console.error('Error toggling filter:', error);
    }
  };

  const resetForm = () => {
    setEditingFilter(null);
    setFormData({
      type: 'KEYWORD',
      pattern: '',
      action: 'FLAG',
      isActive: true,
      description: ''
    });
  };

  const getTypeColor = (type: FilterType) => {
    switch (type) {
      case 'KEYWORD':
        return 'bg-blue-100 text-blue-800';
      case 'PATTERN':
        return 'bg-purple-100 text-purple-800';
      case 'URL':
        return 'bg-green-100 text-green-800';
      case 'EMAIL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PHONE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: FilterAction) => {
    switch (action) {
      case 'FLAG':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLOCK':
        return 'bg-red-100 text-red-800';
      case 'REMOVE':
        return 'bg-orange-100 text-orange-800';
      case 'ESCALATE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Content Filters</h2>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingFilter ? 'Edit Content Filter' : 'Add Content Filter'}
              </DialogTitle>
              <DialogDescription>
                Create or modify content filters to automatically detect and handle inappropriate content.
              </DialogDescription>
            </DialogHeader>

            {success ? (
              <div className="py-6 text-center">
                <div className="text-green-600 mb-2">
                  <CheckCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Filter {editingFilter ? 'Updated' : 'Created'} Successfully
                </h3>
                <p className="text-sm text-gray-600">
                  The content filter has been {editingFilter ? 'updated' : 'created'} and is now active.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="filter-type">Filter Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as FilterType }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEYWORD">Keyword</SelectItem>
                        <SelectItem value="PATTERN">Pattern</SelectItem>
                        <SelectItem value="URL">URL</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-action">Action</Label>
                    <Select value={formData.action} onValueChange={(value) => setFormData(prev => ({ ...prev, action: value as FilterAction }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAG">Flag for Review</SelectItem>
                        <SelectItem value="BLOCK">Block Content</SelectItem>
                        <SelectItem value="REMOVE">Remove Content</SelectItem>
                        <SelectItem value="ESCALATE">Escalate to Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="filter-pattern">Pattern/Keyword</Label>
                  <Input
                    id="filter-pattern"
                    placeholder="Enter the pattern or keyword to match..."
                    value={formData.pattern}
                    onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="filter-description">Description (Optional)</Label>
                  <Textarea
                    id="filter-description"
                    placeholder="Describe what this filter is designed to catch..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="filter-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="filter-active">Filter is active</Label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !formData.pattern}>
                    {isSubmitting ? 'Saving...' : (editingFilter ? 'Update Filter' : 'Add Filter')}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters List */}
      <div className="space-y-4">
        {filters.map((filter) => (
          <Card key={filter.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getTypeColor(filter.type)}>
                      {filter.type}
                    </Badge>
                    <Badge className={getActionColor(filter.action)}>
                      {filter.action}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {filter.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {filter.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {filter.pattern}
                    </code>
                  </div>

                  {filter.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {filter.description}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(filter.createdAt).toLocaleDateString()}
                    {filter.updatedAt !== filter.createdAt && (
                      <span className="ml-4">
                        Updated: {new Date(filter.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(filter.id, !filter.isActive)}
                  >
                    {filter.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(filter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(filter.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filters.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Content Filters</h3>
              <p className="text-muted-foreground mb-4">
                Create content filters to automatically detect and handle inappropriate content.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Filter
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}