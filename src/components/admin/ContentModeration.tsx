'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  MessageSquare, 
  Search, 
  Eye, 
  Trash2, 
  Flag,
  CheckCircle,
  XCircle,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  Shield,
  Calendar,
  User,
  Ban,
  Archive
} from 'lucide-react';

interface ContentItem {
  id: string;
  type: 'post' | 'comment';
  title?: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  reportCount: number;
  isFlagged: boolean;
  subject?: string;
  communityId?: string;
  groupId?: string;
}

interface BulkAction {
  type: 'delete' | 'flag' | 'unflag' | 'archive';
  reason: string;
  targetIds: string[];
}

export function ContentModeration() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState('all');
  const [flagStatus, setFlagStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'delete' | 'flag' | 'unflag' | 'archive'>('delete');
  const [actionReason, setActionReason] = useState('');
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetchContent();
  }, [contentType, flagStatus]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContent();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Mock data for demo - in production, this would fetch from API
      const mockContent: ContentItem[] = [
        {
          id: '1',
          type: 'post',
          title: 'Algebra Study Guide',
          content: 'Here are my comprehensive notes for algebra including quadratic equations, factoring, and graphing...',
          author: { id: '1', name: 'John Doe', email: 'john@example.com' },
          createdAt: '2024-01-15T10:30:00Z',
          reportCount: 3,
          isFlagged: true,
          subject: 'Mathematics'
        },
        {
          id: '2',
          type: 'comment',
          content: 'Great explanation! This really helped me understand the concept better.',
          author: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
          createdAt: '2024-01-15T11:45:00Z',
          reportCount: 0,
          isFlagged: false
        },
        {
          id: '3',
          type: 'post',
          title: 'Chemistry Lab Report Template',
          content: 'Standard template for chemistry lab reports including hypothesis, procedure, and conclusion sections...',
          author: { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
          createdAt: '2024-01-14T14:20:00Z',
          reportCount: 1,
          isFlagged: false,
          subject: 'Science'
        },
        {
          id: '4',
          type: 'comment',
          content: 'This is inappropriate content that violates community guidelines.',
          author: { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
          createdAt: '2024-01-14T16:10:00Z',
          reportCount: 5,
          isFlagged: true
        }
      ];
      setContent(mockContent);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredContent.map(item => item.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item');
      return;
    }

    if (!actionReason.trim()) {
      setError('Please provide a reason for this action');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // In production, this would call the API
      console.log(`Performing ${selectedAction} on items:`, Array.from(selectedItems));
      console.log('Reason:', actionReason);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setContent(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setBulkActionDialog(false);
      setActionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = contentType === 'all' || item.type === contentType;
    const matchesFlag = flagStatus === 'all' || 
      (flagStatus === 'flagged' && item.isFlagged) ||
      (flagStatus === 'unflagged' && !item.isFlagged);

    return matchesSearch && matchesType && matchesFlag;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'flag': return <Flag className="h-4 w-4" />;
      case 'unflag': return <CheckCircle className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'destructive';
      case 'flag': return 'default';
      case 'unflag': return 'outline';
      case 'archive': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content Moderation</h2>
          <p className="text-muted-foreground">Review and moderate platform content with bulk actions</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Shield className="h-4 w-4 mr-2" />
                  Bulk Action ({selectedItems.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Content Action</DialogTitle>
                  <DialogDescription>
                    Apply action to {selectedItems.size} selected content items
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="action">Action Type</Label>
                    <Select value={selectedAction} onValueChange={(value: any) => setSelectedAction(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delete">Delete Content</SelectItem>
                        <SelectItem value="flag">Flag Content</SelectItem>
                        <SelectItem value="unflag">Remove Flag</SelectItem>
                        <SelectItem value="archive">Archive Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide a detailed reason for this bulk action..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkActionDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant={getActionColor(selectedAction) as any}
                      onClick={handleBulkAction}
                      disabled={isProcessing || !actionReason.trim()}
                    >
                      {isProcessing ? 'Processing...' : (
                        <>
                          {getActionIcon(selectedAction)}
                          {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Selected
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
            <Select value={flagStatus} onValueChange={setFlagStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="unflagged">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Content ({filteredContent.length})</CardTitle>
          <CardDescription>
            Review and moderate posts and comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header with select all */}
              <div className="flex items-center gap-4 p-2 border-b">
                <Checkbox
                  checked={selectedItems.size === filteredContent.length && filteredContent.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedItems.size} selected
                </span>
              </div>

              {filteredContent.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => handleSelectItem(item.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {item.author.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.author.name}</span>
                            <Badge variant={item.type === 'post' ? 'default' : 'secondary'}>
                              {item.type === 'post' ? <FileText className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                              {item.type}
                            </Badge>
                            {item.isFlagged && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                            {item.subject && (
                              <Badge variant="outline">
                                {item.subject}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.author.email} • {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.reportCount > 0 && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            {item.reportCount} reports
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setPreviewItem(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {item.type === 'post' ? item.title : 'Comment Review'}
                              </DialogTitle>
                              <DialogDescription>
                                Review content and take appropriate action
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>Author</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {item.author.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{item.author.name}</span>
                                  <span className="text-sm text-muted-foreground">({item.author.email})</span>
                                </div>
                              </div>

                              <div>
                                <Label>Content</Label>
                                <div className="mt-1 p-3 bg-muted rounded">
                                  {item.title && (
                                    <div className="font-medium mb-2">{item.title}</div>
                                  )}
                                  <p className="text-sm">{item.content}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(item.createdAt)}
                                </div>
                                {item.reportCount > 0 && (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <Flag className="h-4 w-4" />
                                    {item.reportCount} reports
                                  </div>
                                )}
                              </div>

                              <DialogFooter className="flex gap-2">
                                <Button variant="outline" onClick={() => setPreviewItem(null)}>
                                  Close
                                </Button>
                                <Button variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="mt-2">
                      {item.title && (
                        <div className="font-medium text-sm">{item.title}</div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.content.length > 150 
                          ? `${item.content.slice(0, 150)}...` 
                          : item.content
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredContent.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No content found matching your search criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}