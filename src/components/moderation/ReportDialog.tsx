'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, AlertTriangle } from 'lucide-react';
import { ReportType } from '@prisma/client';

interface ReportDialogProps {
  targetId: string;
  targetType: 'POST' | 'COMMENT' | 'USER';
  postId?: string;
  commentId?: string;
  children: React.ReactNode;
}

const reportReasons = {
  [ReportType.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
  [ReportType.SPAM]: 'Spam',
  [ReportType.HARASSMENT]: 'Harassment',
  [ReportType.BULLYING]: 'Bullying',
  [ReportType.COPYRIGHT]: 'Copyright Violation',
  [ReportType.HATE_SPEECH]: 'Hate Speech',
  [ReportType.THREATS]: 'Threats',
  [ReportType.PERSONAL_INFO]: 'Personal Information',
  [ReportType.IMPERSONATION]: 'Impersonation',
  [ReportType.SCAM]: 'Scam',
  [ReportType.OTHER]: 'Other',
};

export function ReportDialog({ 
  targetId, 
  targetType, 
  postId, 
  commentId, 
  children 
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError('Please select a report reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          reason: reportReasons[selectedType as ReportType],
          description: description || undefined,
          evidence: evidence || undefined,
          targetId,
          targetType,
          postId,
          commentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setSelectedType('');
        setDescription('');
        setEvidence('');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setOpen(false);
      setError('');
      setSuccess(false);
      setSelectedType('');
      setDescription('');
      setEvidence('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report {targetType.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting content that violates our guidelines.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="text-green-600 mb-2">
              <AlertTriangle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Report Submitted Successfully
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for helping keep our community safe. We'll review your report shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Reason for reporting *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportReasons).map(([type, reason]) => (
                    <SelectItem key={type} value={type}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional details about why you're reporting this content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence (Optional)</Label>
              <Textarea
                id="evidence"
                placeholder="Any additional evidence or context that might help with the review..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={2}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedType}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}