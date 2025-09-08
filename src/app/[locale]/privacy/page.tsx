'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Download, Calendar, MapPin, Mail, Phone } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');

  const sections = [
    {
      icon: FileText,
      title: 'Information We Collect',
      content: [
        'Personal identification information (name, email, profile picture)',
        'Educational information (school, grade, subjects)',
        'Content you create and share on the platform',
        'Usage data and analytics information',
        'Device and browser information',
        'Communication data (messages, comments)'
      ]
    },
    {
      icon: Shield,
      title: 'How We Use Your Information',
      content: [
        'To provide and maintain our educational platform',
        'To personalize your learning experience',
        'To communicate with you about your account',
        'To improve our services and content',
        'To ensure platform security and prevent abuse',
        'To comply with legal obligations'
      ]
    },
    {
      icon: MapPin,
      title: 'Data Storage and Security',
      content: [
        'All data is encrypted in transit and at rest',
        'Stored securely on EU-based servers',
        'Regular security audits and vulnerability assessments',
        'Access limited to authorized personnel only',
        'Data retention periods as required by law',
        'Secure backup and disaster recovery systems'
      ]
    },
    {
      icon: Download,
      title: 'Your Data Rights',
      content: [
        'Right to access your personal data',
        'Right to correct inaccurate information',
        'Right to delete your data (Right to be forgotten)',
        'Right to data portability',
        'Right to restrict or object to processing',
        'Right to withdraw consent at any time'
      ]
    }
  ];

  const complianceStandards = [
    'KVKK (Turkish Personal Data Protection Law)',
    'GDPR (General Data Protection Regulation)',
    'COPPA (Children\'s Online Privacy Protection Act)',
    'ISO 27001 (Information Security Management)'
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          Privacy Policy
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We are committed to protecting your privacy and ensuring the security of your personal information. 
          This policy explains how we collect, use, and safeguard your data.
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {complianceStandards.map((standard) => (
            <span key={standard} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {standard}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-8 mb-12">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes 
              for which it was collected, including legal, accounting, or reporting requirements.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Active Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  Data retained while account is active
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Deleted Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  Data anonymized or deleted within 30 days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              If you have any questions about this Privacy Policy or how we handle your personal data, 
              please contact our Data Protection Officer:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>privacy@owl-platform.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>+90 216 123 4567</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Policy Updates</CardTitle>
          <CardDescription>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last Updated" date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookie Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              We use cookies and similar tracking technologies to enhance your experience on our platform. 
              You can manage your cookie preferences through your browser settings.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <h5 className="font-semibold text-sm mb-1">Essential Cookies</h5>
                <p className="text-xs text-muted-foreground">Required for basic functionality</p>
              </div>
              <div className="p-3 border rounded">
                <h5 className="font-semibold text-sm mb-1">Analytics Cookies</h5>
                <p className="text-xs text-muted-foreground">Help us improve our platform</p>
              </div>
              <div className="p-3 border rounded">
                <h5 className="font-semibold text-sm mb-1">Marketing Cookies</h5>
                <p className="text-xs text-muted-foreground">Personalized content and ads</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}