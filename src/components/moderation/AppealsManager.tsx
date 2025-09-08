'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Gavel, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Eye,
  FileText,
  MessageSquare
} from 'lucide-react';
// Note: AppealStatus is used as string literals to avoid Prisma client issues
type AppealStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

interface Appeal {
  id: string;
  reason: string;
  description: string;
  status: AppealStatus;
  decision?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  report: {
    id: string;
    type: string;
    reason: string;
    status: string;
    resolution?: string;
    createdAt: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export function AppealsManager() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [decision, setDecision] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppeals();
  }, [statusFilter]);

  const fetchAppeals = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/appeals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals);
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppeal = async (appealId: string, status: AppealStatus) => {
    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/appeals/${appealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          decision: decision || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update appeal');
      }

      await fetchAppeals();
      setSelectedAppeal(null);
      setDecision('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: AppealStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStats = () => {
    const stats = {
      pending: appeals.filter(a => a.status === 'PENDING').length,
      underReview: appeals.filter(a => a.status === 'UNDER_REVIEW').length,
      approved: appeals.filter(a => a.status === 'APPROVED').length,
      rejected: appeals.filter(a => a.status === 'REJECTED').length,
    };
    return stats;
  };

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
        <h2 className="text-2xl font-bold">Appeals Management</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusStats.underReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusStats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusStats.rejected}</div>
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appeals List */}
      <Card>
        <CardHeader>
          <CardTitle>Appeals ({appeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appeal.user.name}</span>
                      <Badge className={getStatusColor(appeal.status)}>
                        {appeal.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(appeal.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem onSelect={() => setSelectedAppeal(appeal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review Appeal
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review Appeal</DialogTitle>
                            <DialogDescription>
                              Review the appeal and make a decision.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {/* Appeal Details */}
                            <div>
                              <h4 className="font-medium mb-2">Appeal Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Appellant:</span> {appeal.user.name}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>
                                  <Badge className={`ml-2 ${getStatusColor(appeal.status)}`}>
                                    {appeal.status}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="font-medium">Appeal Date:</span> {new Date(appeal.createdAt).toLocaleDateString()}
                                </div>
                                {appeal.reviewer && (
                                  <div>
                                    <span className="font-medium">Reviewer:</span> {appeal.reviewer.name}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Original Report */}
                            <div>
                              <h4 className="font-medium mb-2">Original Report</h4>
                              <div className="bg-gray-50 p-3 rounded">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Report Type:</span> {appeal.report.type}
                                  </div>
                                  <div>
                                    <span className="font-medium">Report Status:</span> {appeal.report.status}
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-medium">Report Reason:</span> {appeal.report.reason}
                                  </div>
                                  {appeal.report.resolution && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Resolution:</span> {appeal.report.resolution}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Appeal Content */}
                            <div>
                              <h4 className="font-medium mb-2">Appeal Reason</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded">
                                {appeal.reason}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Appeal Description</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded">
                                {appeal.description}
                              </p>
                            </div>

                            {/* Decision */}
                            {appeal.status === 'PENDING' && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="decision">Decision (Optional)</Label>
                                  <Textarea
                                    id="decision"
                                    placeholder="Provide your decision and reasoning..."
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
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
                                    onClick={() => updateAppeal(appeal.id, 'REJECTED')}
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Appeal
                                  </Button>
                                  <Button
                                    onClick={() => updateAppeal(appeal.id, 'UNDER_REVIEW')}
                                    disabled={isUpdating}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Mark Under Review
                                  </Button>
                                  <Button
                                    onClick={() => updateAppeal(appeal.id, 'APPROVED')}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Appeal
                                  </Button>
                                </DialogFooter>
                              </div>
                            )}

                            {appeal.decision && (
                              <div>
                                <h4 className="font-medium mb-2">Decision</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">
                                  {appeal.decision}
                                </p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <div className="font-medium">{appeal.reason}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {appeal.description.slice(0, 100)}...
                  </p>
                </div>

                {/* Report Info */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <div className="font-medium">Report: {appeal.report.reason}</div>
                    {appeal.report.resolution && (
                      <div className="text-muted-foreground mt-1">
                        Resolution: {appeal.report.resolution}
                      </div>
                    )}
                  </div>
                </div>

                {appeal.reviewer && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    Reviewed by: {appeal.reviewer.name}
                  </div>
                )}
              </div>
            ))}

            {appeals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No appeals found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}