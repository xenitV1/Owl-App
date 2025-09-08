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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ban, VolumeX, UserX, Volume2 } from 'lucide-react';

interface UserControlsProps {
  targetUserId: string;
  targetUserName: string;
  isBlocked?: boolean;
  isMuted?: boolean;
  onBlockChange?: (blocked: boolean) => void;
  onMuteChange?: (muted: boolean) => void;
  children: React.ReactNode;
}

export function UserControls({
  targetUserId,
  targetUserName,
  isBlocked = false,
  isMuted = false,
  onBlockChange,
  onMuteChange,
  children
}: UserControlsProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [muteReason, setMuteReason] = useState('');
  const [muteDuration, setMuteDuration] = useState('7d');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBlock = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedId: targetUserId,
          reason: blockReason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to block user');
      }

      setSuccess(true);
      onBlockChange?.(true);
      setTimeout(() => {
        setBlockDialogOpen(false);
        setSuccess(false);
        setBlockReason('');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblock = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/blocks/${targetUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unblock user');
      }

      onBlockChange?.(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMute = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/mutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mutedId: targetUserId,
          reason: muteReason || undefined,
          duration: muteDuration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mute user');
      }

      setSuccess(true);
      onMuteChange?.(true);
      setTimeout(() => {
        setMuteDialogOpen(false);
        setSuccess(false);
        setMuteReason('');
        setMuteDuration('7d');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmute = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/mutes/${targetUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unmute user');
      }

      onMuteChange?.(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Block User
            </DialogTitle>
            <DialogDescription>
              Blocking {targetUserName} will prevent them from interacting with you and seeing your content.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center">
              <div className="text-green-600 mb-2">
                <Ban className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                User Blocked Successfully
              </h3>
              <p className="text-sm text-gray-600">
                {targetUserName} has been blocked and will no longer be able to interact with you.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleBlock(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="block-reason">Reason (Optional)</Label>
                <Textarea
                  id="block-reason"
                  placeholder="Why are you blocking this user?"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                  {isSubmitting ? 'Blocking...' : 'Block User'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Mute Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <VolumeX className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <VolumeX className="h-5 w-5" />
              Mute User
            </DialogTitle>
            <DialogDescription>
              Muting {targetUserName} will hide their content from your feeds without blocking them.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center">
              <div className="text-green-600 mb-2">
                <VolumeX className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                User Muted Successfully
              </h3>
              <p className="text-sm text-gray-600">
                {targetUserName} has been muted and their content will be hidden from your feeds.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleMute(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mute-duration">Duration</Label>
                <Select value={muteDuration} onValueChange={setMuteDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mute-reason">Reason (Optional)</Label>
                <Textarea
                  id="mute-reason"
                  placeholder="Why are you muting this user?"
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMuteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Muting...' : 'Mute User'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {isBlocked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnblock}
            disabled={isSubmitting}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Unblock
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBlockDialogOpen(true)}
            disabled={isSubmitting}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Ban className="h-4 w-4 mr-2" />
            Block
          </Button>
        )}

        {isMuted ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnmute}
            disabled={isSubmitting}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Unmute
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMuteDialogOpen(true)}
            disabled={isSubmitting}
          >
            <VolumeX className="h-4 w-4 mr-2" />
            Mute
          </Button>
        )}
      </div>
    </>
  );
}