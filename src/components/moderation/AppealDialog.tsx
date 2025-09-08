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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gavel, AlertTriangle, CheckCircle } from 'lucide-react';

interface AppealDialogProps {
  reportId: string;
  reportReason: string;
  reportResolution: string;
  children: React.ReactNode;
}

export function AppealDialog({ 
  reportId, 
  reportReason, 
  reportResolution, 
  children 
}: AppealDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim() || !description.trim()) {
      setError('Please provide both reason and description for your appeal');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          reason: reason.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setReason('');
        setDescription('');
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
      setReason('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Appeal Moderation Decision
          </DialogTitle>
          <DialogDescription>
            You can appeal this moderation decision if you believe it was made in error.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="text-green-600 mb-2">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Appeal Submitted Successfully
            </h3>
            <p className="text-sm text-gray-600">
              Your appeal has been submitted and will be reviewed by an administrator. You will be notified of the decision.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Details */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-sm mb-2">Original Report Details</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Reason:</span> {reportReason}</div>
                <div><span className="font-medium">Resolution:</span> {reportResolution}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal-reason">Appeal Reason *</Label>
              <Textarea
                id="appeal-reason"
                placeholder="Explain why you believe this moderation decision should be overturned..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal-description">Detailed Description *</Label>
              <Textarea
                id="appeal-description"
                placeholder="Provide a detailed explanation of your appeal, including any evidence or context that supports your case..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Appeals are reviewed by administrators. Submitting false or frivolous appeals may result in additional moderation actions.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !reason.trim() || !description.trim()}>
                {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}