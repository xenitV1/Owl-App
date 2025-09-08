'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Trash2, AlertTriangle, Shield, FileText, Database, Mail } from 'lucide-react';

export function DataControls() {
  const t = useTranslations('settings');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setExportStatus(null);

      const response = await fetch('/api/user/data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // In production, use proper auth
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `owl_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportStatus('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteStatus(null);

      const response = await fetch('/api/user/data/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // In production, use proper auth
        },
        body: JSON.stringify({
          confirmText: deleteConfirmText,
          deleteReason: deleteReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      setDeleteStatus(data.message);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
      setDeleteReason('');

      // In a real app, you would log the user out and redirect them
      setTimeout(() => {
        window.location.href = '/goodbye';
      }, 3000);

    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteStatus(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const dataCategories = [
    {
      icon: FileText,
      title: 'Profile Information',
      description: 'Your personal details, school information, and preferences',
    },
    {
      icon: Database,
      title: 'Content & Activity',
      description: 'Posts, comments, saved items, and community memberships',
    },
    {
      icon: Mail,
      title: 'Communications',
      description: 'Messages, notifications, and interaction history',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('dataControls.exportData')}
          </CardTitle>
          <CardDescription>
            Download all your data in a portable format. This includes your profile, posts, comments, 
            and all other information associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {dataCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <Icon className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold text-sm mb-1">{category.title}</h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              );
            })}
          </div>

          {exportStatus && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>{exportStatus}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleExportData} disabled={isExporting} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('dataControls.deleteData')}
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete your account, all your posts, 
              comments, saved items, and personal data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>When you delete your account:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your profile will be permanently removed</li>
              <li>All your posts and comments will be deleted</li>
              <li>Your community memberships will be revoked</li>
              <li>Saved items and preferences will be removed</li>
              <li>The action cannot be reversed</li>
            </ul>
          </div>

          {deleteStatus && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>{deleteStatus}</AlertDescription>
            </Alert>
          )}

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Account Deletion
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Please type "DELETE MY ACCOUNT" to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm-text">Confirmation Text</Label>
                  <Input
                    id="confirm-text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delete-reason">Reason (Optional)</Label>
                  <Textarea
                    id="delete-reason"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Please let us know why you're deleting your account..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleDeleteAccount} 
                    disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmText('');
                      setDeleteReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}