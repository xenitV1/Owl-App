'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Flag, 
  Clock, 
  User, 
  MessageSquare, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Eye,
  Ban,
  Trash2,
  Filter,
  Gavel
} from 'lucide-react';
import { ReportStatus, ReportPriority, ModerationActionType } from '@prisma/client';
import { ContentFilterManager } from './ContentFilterManager';
import { AppealsManager } from './AppealsManager';

interface Report {
  id: string;
  type: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  priority: ReportPriority;
  evidence?: string;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  post?: {
    id: string;
    title: string;
    content?: string;
  };
  comment?: {
    id: string;
    content: string;
  };
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [resolution, setResolution] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, priorityFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateReport = async (reportId: string, updates: any) => {
    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update report');
      }

      await fetchReports();
      setSelectedReport(null);
      setResolution('');
      setSelectedAction('');
      setActionReason('');
      setAssignedTo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = (status: ReportStatus) => {
    if (!selectedReport) return;

    const updates: any = { status };
    if (resolution) updates.resolution = resolution;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (selectedAction && actionReason) {
      updates.action = selectedAction;
      updates.actionReason = actionReason;
    }

    updateReport(selectedReport.id, updates);
  };

  const getPriorityColor = (priority: ReportPriority) => {
    switch (priority) {
      case ReportPriority.URGENT:
        return 'bg-red-500 text-white';
      case ReportPriority.HIGH:
        return 'bg-orange-500 text-white';
      case ReportPriority.MEDIUM:
        return 'bg-yellow-500 text-white';
      case ReportPriority.LOW:
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return 'bg-gray-500 text-white';
      case ReportStatus.REVIEWING:
        return 'bg-blue-500 text-white';
      case ReportStatus.RESOLVED:
        return 'bg-green-500 text-white';
      case ReportStatus.DISMISSED:
        return 'bg-red-500 text-white';
      case ReportStatus.ESCALATED:
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityStats = () => {
    const stats = {
      urgent: reports.filter(r => r.priority === ReportPriority.URGENT).length,
      high: reports.filter(r => r.priority === ReportPriority.HIGH).length,
      medium: reports.filter(r => r.priority === ReportPriority.MEDIUM).length,
      low: reports.filter(r => r.priority === ReportPriority.LOW).length,
    };
    return stats;
  };

  const getStatusStats = () => {
    const stats = {
      pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
      reviewing: reports.filter(r => r.status === ReportStatus.REVIEWING).length,
      resolved: reports.filter(r => r.status === ReportStatus.RESOLVED).length,
      dismissed: reports.filter(r => r.status === ReportStatus.DISMISSED).length,
      escalated: reports.filter(r => r.status === ReportStatus.ESCALATED).length,
    };
    return stats;
  };

  const priorityStats = getPriorityStats();
  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Content Filters
          </TabsTrigger>
          <TabsTrigger value="appeals" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Appeals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{priorityStats.urgent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Flag className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{priorityStats.high}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statusStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={ReportStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={ReportStatus.REVIEWING}>Reviewing</SelectItem>
                      <SelectItem value={ReportStatus.RESOLVED}>Resolved</SelectItem>
                      <SelectItem value={ReportStatus.DISMISSED}>Dismissed</SelectItem>
                      <SelectItem value={ReportStatus.ESCALATED}>Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority-filter">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value={ReportPriority.URGENT}>Urgent</SelectItem>
                      <SelectItem value={ReportPriority.HIGH}>High</SelectItem>
                      <SelectItem value={ReportPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={ReportPriority.LOW}>Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
                      <SelectItem value="SPAM">Spam</SelectItem>
                      <SelectItem value="HARASSMENT">Harassment</SelectItem>
                      <SelectItem value="BULLYING">Bullying</SelectItem>
                      <SelectItem value="COPYRIGHT">Copyright</SelectItem>
                      <SelectItem value="HATE_SPEECH">Hate Speech</SelectItem>
                      <SelectItem value="THREATS">Threats</SelectItem>
                      <SelectItem value="PERSONAL_INFO">Personal Info</SelectItem>
                      <SelectItem value="IMPERSONATION">Impersonation</SelectItem>
                      <SelectItem value="SCAM">Scam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {report.reporter.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{report.reporter.name}</span>
                            <Badge className={getPriorityColor(report.priority)}>
                              {report.priority}
                            </Badge>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={() => setSelectedReport(report)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Review Report
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Report</DialogTitle>
                                <DialogDescription>
                                  Review the reported content and take appropriate action.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                {/* Report Details */}
                                <div>
                                  <h4 className="font-medium mb-2">Report Details</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Type:</span> {report.reason}
                                    </div>
                                    <div>
                                      <span className="font-medium">Priority:</span> 
                                      <Badge className={`ml-2 ${getPriorityColor(report.priority)}`}>
                                        {report.priority}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="font-medium">Status:</span>
                                      <Badge className={`ml-2 ${getStatusColor(report.status)}`}>
                                        {report.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="font-medium">Reporter:</span> {report.reporter.name}
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                {report.description && (
                                  <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm bg-gray-50 p-3 rounded">
                                      {report.description}
                                    </p>
                                  </div>
                                )}

                                {/* Evidence */}
                                {report.evidence && (
                                  <div>
                                    <h4 className="font-medium mb-2">Evidence</h4>
                                    <p className="text-sm bg-gray-50 p-3 rounded">
                                      {report.evidence}
                                    </p>
                                  </div>
                                )}

                                {/* Reported Content */}
                                <div>
                                  <h4 className="font-medium mb-2">Reported Content</h4>
                                  {report.post ? (
                                    <div className="border rounded p-3">
                                      <div className="font-medium">{report.post.title}</div>
                                      {report.post.content && (
                                        <p className="text-sm text-muted-foreground mt-1 break-words break-all whitespace-pre-wrap">
                                          {report.post.content}
                                        </p>
                                      )}
                                    </div>
                                  ) : report.comment ? (
                                    <div className="border rounded p-3">
                                      <p className="text-sm break-words break-all whitespace-pre-wrap">{report.comment.content}</p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No content available</p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="assign-to">Assign To</Label>
                                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select moderator" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {users.map((user) => (
                                          <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="action">Moderation Action</Label>
                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={ModerationActionType.WARNING}>Warning</SelectItem>
                                        <SelectItem value={ModerationActionType.CONTENT_REMOVAL}>Remove Content</SelectItem>
                                        <SelectItem value={ModerationActionType.POST_REMOVAL}>Remove Post</SelectItem>
                                        <SelectItem value={ModerationActionType.COMMENT_REMOVAL}>Remove Comment</SelectItem>
                                        <SelectItem value={ModerationActionType.ACCOUNT_SUSPENSION}>Suspend Account</SelectItem>
                                        <SelectItem value={ModerationActionType.ACCOUNT_BAN}>Ban Account</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {selectedAction && (
                                    <div>
                                      <Label htmlFor="action-reason">Action Reason</Label>
                                      <Textarea
                                        id="action-reason"
                                        placeholder="Explain the reason for this action..."
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        rows={2}
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <Label htmlFor="resolution">Resolution</Label>
                                    <Textarea
                                      id="resolution"
                                      placeholder="Provide resolution details..."
                                      value={resolution}
                                      onChange={(e) => setResolution(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  {error && (
                                    <Alert variant="destructive">
                                      <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                  )}

                                  <DialogFooter className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(ReportStatus.DISMISSED)}
                                      disabled={isUpdating}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Dismiss
                                    </Button>
                                    <Button
                                      onClick={() => handleStatusUpdate(ReportStatus.RESOLVED)}
                                      disabled={isUpdating}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Resolve
                                    </Button>
                                  </DialogFooter>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <div className="font-medium">{report.reason}</div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      )}
                    </div>

                    {/* Content Preview */}
                    {report.post && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="font-medium text-sm">Post: {report.post.title}</div>
                        {report.post.content && (
                          <p className="text-sm text-muted-foreground mt-1 break-words break-all whitespace-pre-wrap">
                            {report.post.content.slice(0, 100)}...
                          </p>
                        )}
                      </div>
                    )}

                    {report.comment && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="font-medium text-sm">Comment:</div>
                        <p className="text-sm text-muted-foreground mt-1 break-words break-all whitespace-pre-wrap">
                          {report.comment.content.slice(0, 100)}...
                        </p>
                      </div>
                    )}

                    {report.assignedToUser && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        Assigned to: {report.assignedToUser.name}
                      </div>
                    )}
                  </div>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports found matching your filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters">
          <ContentFilterManager />
        </TabsContent>

        <TabsContent value="appeals">
          <AppealsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}