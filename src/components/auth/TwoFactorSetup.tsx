'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

interface TwoFactorSetupProps {
  userId: string;
  onSetupComplete: (secret: string) => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ userId, onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const t = useTranslations('settings');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generate2FASecret();
  }, []);

  const generate2FASecret = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/2fa/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA secret');
      }

      const data = await response.json();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
    } catch (error) {
      setError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          secret,
          token: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      setBackupCodes(data.backupCodes || []);
      setStep('complete');
      onSetupComplete(secret);
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Store backup codes securely or show them to user
    onSetupComplete(secret);
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('twoFactorAuth')}
          </CardTitle>
          <CardDescription>
            Set up two-factor authentication to add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label>1. Install an authenticator app</Label>
            <p className="text-sm text-muted-foreground">
              Download Google Authenticator, Authy, or any other authenticator app on your smartphone.
            </p>
          </div>

          <div className="space-y-2">
            <Label>2. Scan the QR code</Label>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {qrCodeUrl ? (
                <QRCodeSVG value={qrCodeUrl} size={200} />
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>3. Or enter the secret manually</Label>
            <div className="p-2 bg-muted rounded font-mono text-sm">
              {secret}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep('verify')} disabled={isLoading || !secret}>
              Continue
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify 2FA Setup
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to verify the setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
              Verify
            </Button>
            <Button variant="outline" onClick={() => setStep('setup')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          2FA Setup Complete
        </CardTitle>
        <CardDescription>
          Two-factor authentication has been successfully enabled for your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Backup Codes</Label>
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm p-2 bg-background rounded">
                {code}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleComplete} className="w-full">
          I've Saved My Backup Codes
        </Button>
      </CardContent>
    </Card>
  );
}