'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cookie, Shield, Eye, Target, MessageSquare, BarChart3 } from 'lucide-react';

interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  communication: boolean;
}

interface ConsentManagerProps {
  onConsentUpdate?: (settings: ConsentSettings) => void;
  showDetails?: boolean;
}

export function ConsentManager({ onConsentUpdate, showDetails = false }: ConsentManagerProps) {
  const t = useTranslations('settings');
  const [settings, setSettings] = useState<ConsentSettings>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false,
    communication: false,
  });
  const [hasSaved, setHasSaved] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(showDetails);

  useEffect(() => {
    // Load saved consent settings from localStorage
    const savedConsent = localStorage.getItem('owl_consent_settings');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setSettings(parsed);
        setHasSaved(true);
      } catch (error) {
        console.error('Error loading consent settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof ConsentSettings, value: boolean) => {
    if (key === 'essential') return; // Essential cannot be disabled
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('owl_consent_settings', JSON.stringify(settings));
    setHasSaved(true);
    
    // Set consent cookie
    document.cookie = `owl_consent_given=true; path=/; max-age=31536000; secure; samesite=strict`;
    
    if (onConsentUpdate) {
      onConsentUpdate(settings);
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      communication: true,
    };
    setSettings(allAccepted);
    localStorage.setItem('owl_consent_settings', JSON.stringify(allAccepted));
    setHasSaved(true);
    
    document.cookie = `owl_consent_given=true; path=/; max-age=31536000; secure; samesite=strict`;
    
    if (onConsentUpdate) {
      onConsentUpdate(allAccepted);
    }
  };

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      communication: false,
    };
    setSettings(essentialOnly);
    localStorage.setItem('owl_consent_settings', JSON.stringify(essentialOnly));
    setHasSaved(true);
    
    document.cookie = `owl_consent_given=true; path=/; max-age=31536000; secure; samesite=strict`;
    
    if (onConsentUpdate) {
      onConsentUpdate(essentialOnly);
    }
  };

  const consentOptions = [
    {
      key: 'essential' as keyof ConsentSettings,
      icon: Shield,
      title: 'Essential Cookies',
      description: 'Required for basic website functionality. Cannot be disabled.',
      required: true,
    },
    {
      key: 'analytics' as keyof ConsentSettings,
      icon: BarChart3,
      title: 'Analytics Cookies',
      description: 'Help us understand how you use our platform to improve your experience.',
      required: false,
    },
    {
      key: 'personalization' as keyof ConsentSettings,
      icon: Eye,
      title: 'Personalization Cookies',
      description: 'Remember your preferences and customize your learning experience.',
      required: false,
    },
    {
      key: 'marketing' as keyof ConsentSettings,
      icon: Target,
      title: 'Marketing Cookies',
      description: 'Show you relevant advertisements and content based on your interests.',
      required: false,
    },
    {
      key: 'communication' as keyof ConsentSettings,
      icon: MessageSquare,
      title: 'Communication Cookies',
      description: 'Enable chat and messaging features for better collaboration.',
      required: false,
    },
  ];

  if (!showAllDetails) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </CardTitle>
          <CardDescription>
            We use cookies to enhance your experience and provide personalized content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your privacy is important to us. You can change your preferences at any time.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button onClick={acceptAll} className="flex-1">
              Accept All
            </Button>
            <Button onClick={acceptEssential} variant="outline" className="flex-1">
              Essential Only
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowAllDetails(true)}
            className="w-full"
          >
            Customize Preferences
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Cookie & Privacy Preferences
        </CardTitle>
        <CardDescription>
          Manage your privacy settings and control how we use your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {consentOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.key} className="flex items-start gap-4 p-4 border rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{option.title}</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={(checked) => handleSettingChange(option.key, checked)}
                    disabled={option.required}
                  />
                </div>
                {option.required && (
                  <p className="text-xs text-primary">Required</p>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={saveSettings} className="flex-1">
            {hasSaved ? 'Update Preferences' : 'Save Preferences'}
          </Button>
          <Button onClick={() => setShowAllDetails(false)} variant="outline">
            Show Less
          </Button>
        </div>

        {hasSaved && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your preferences have been saved. You can update them at any time from your settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}