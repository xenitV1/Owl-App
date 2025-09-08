'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, UserCheck, Mail, Phone, Calendar, Users, AlertTriangle } from 'lucide-react';

interface AgeVerificationProps {
  onVerificationComplete: (data: AgeVerificationData) => void;
  onSkip?: () => void;
}

interface AgeVerificationData {
  dateOfBirth: string;
  age: number;
  isMinor: boolean;
  parentalConsent?: {
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    relationship: string;
    consentGiven: boolean;
    consentDate: string;
  };
}

export function AgeVerification({ onVerificationComplete, onSkip }: AgeVerificationProps) {
  const t = useTranslations('auth');
  const [step, setStep] = useState<'age' | 'parental' | 'confirmation'>('age');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const [parentalData, setParentalData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleAgeSubmit = () => {
    if (!dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    const calculatedAge = calculateAge(dateOfBirth);
    setAge(calculatedAge);
    
    if (calculatedAge < 13) {
      setError('You must be at least 13 years old to use this platform');
      return;
    }

    setIsMinor(calculatedAge < 18);

    if (calculatedAge < 18) {
      setStep('parental');
    } else {
      completeVerification(calculatedAge, false);
    }
  };

  const handleParentalSubmit = () => {
    if (!parentalData.parentName || !parentalData.parentEmail || !parentalData.relationship) {
      setError('Please fill in all parental consent fields');
      return;
    }

    if (!isValidEmail(parentalData.parentEmail)) {
      setError('Please enter a valid parent email address');
      return;
    }

    completeVerification(age!, true);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const completeVerification = (verifiedAge: number, minor: boolean) => {
    const verificationData: AgeVerificationData = {
      dateOfBirth,
      age: verifiedAge,
      isMinor: minor,
    };

    if (minor) {
      verificationData.parentalConsent = {
        parentName: parentalData.parentName,
        parentEmail: parentalData.parentEmail,
        parentPhone: parentalData.parentPhone,
        relationship: parentalData.relationship,
        consentGiven: true,
        consentDate: new Date().toISOString(),
      };
    }

    onVerificationComplete(verificationData);
  };

  const relationshipOptions = [
    'Parent',
    'Legal Guardian',
    'Foster Parent',
    'Other Legal Representative',
  ];

  if (step === 'age') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Age Verification
          </CardTitle>
          <CardDescription>
            To comply with privacy laws, we need to verify your age before you can use our platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="date-of-birth">Date of Birth</Label>
            <Input
              id="date-of-birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>You must be at least 13 years old to use this platform.</p>
            <p>If you are under 18, we will need parental consent.</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAgeSubmit} className="flex-1">
              Continue
            </Button>
            {onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'parental') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parental Consent Required
          </CardTitle>
          <CardDescription>
            Since you are under 18 years old, we need consent from your parent or legal guardian.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your parent or guardian will receive an email to confirm their consent. 
              Your account will have limited functionality until consent is verified.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="parent-name">Parent/Guardian Full Name</Label>
            <Input
              id="parent-name"
              value={parentalData.parentName}
              onChange={(e) => setParentalData(prev => ({ ...prev, parentName: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-email">Parent/Guardian Email</Label>
            <Input
              id="parent-email"
              type="email"
              value={parentalData.parentEmail}
              onChange={(e) => setParentalData(prev => ({ ...prev, parentEmail: e.target.value }))}
              placeholder="parent@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-phone">Parent/Guardian Phone (Optional)</Label>
            <Input
              id="parent-phone"
              type="tel"
              value={parentalData.parentPhone}
              onChange={(e) => setParentalData(prev => ({ ...prev, parentPhone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={parentalData.relationship} onValueChange={(value) => setParentalData(prev => ({ ...prev, relationship: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleParentalSubmit} className="flex-1">
              Submit for Consent
            </Button>
            <Button variant="outline" onClick={() => setStep('age')}>
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
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Shield className="h-5 w-5" />
          Verification Complete
        </CardTitle>
        <CardDescription>
          Your age verification has been completed successfully.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {isMinor ? (
              <>
                Parental consent has been requested. Your parent or guardian will receive an email 
                to confirm their consent. You'll have full access once consent is verified.
              </>
            ) : (
              <>
                You have full access to all platform features. Welcome to Owl!
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2 text-sm">
          <p><strong>Age:</strong> {age} years old</p>
          <p><strong>Status:</strong> {isMinor ? 'Minor (Parental consent pending)' : 'Adult'}</p>
          {isMinor && (
            <p><strong>Consent sent to:</strong> {parentalData.parentEmail}</p>
          )}
        </div>

        <Button onClick={() => onVerificationComplete({
          dateOfBirth,
          age: age!,
          isMinor,
          parentalConsent: isMinor ? {
            parentName: parentalData.parentName,
            parentEmail: parentalData.parentEmail,
            parentPhone: parentalData.parentPhone,
            relationship: parentalData.relationship,
            consentGiven: false, // Will be updated when parent confirms
            consentDate: new Date().toISOString(),
          } : undefined,
        })} className="w-full">
          Continue to Platform
        </Button>
      </CardContent>
    </Card>
  );
}