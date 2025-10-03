'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
            
            <div className="flex items-center justify-center mb-6">
              <Logo size="lg" />
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">
              {t('title')}
            </h1>
            <p className="text-center text-gray-600 mb-2">
              {t('lastUpdate')}
            </p>
            <p className="text-center text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  {t('dataCollection.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>{t('dataCollection.description')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('dataCollection.items.account')}</li>
                  <li>{t('dataCollection.items.profile')}</li>
                  <li>{t('dataCollection.items.content')}</li>
                  <li>{t('dataCollection.items.usage')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-green-600" />
                  {t('dataUsage.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>{t('dataUsage.description')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('dataUsage.items.service')}</li>
                  <li>{t('dataUsage.items.personalization')}</li>
                  <li>{t('dataUsage.items.recommendations')}</li>
                  <li>{t('dataUsage.items.security')}</li>
                  <li>{t('dataUsage.items.legal')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5 text-red-600" />
                  {t('dataSecurity.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>{t('dataSecurity.description')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('dataSecurity.items.encryption')}</li>
                  <li>{t('dataSecurity.items.storage')}</li>
                  <li>{t('dataSecurity.items.audits')}</li>
                  <li>{t('dataSecurity.items.access')}</li>
                  <li>{t('dataSecurity.items.backup')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5 text-purple-600" />
                  {t('userRights.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>{t('userRights.description')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('userRights.items.access')}</li>
                  <li>{t('userRights.items.correction')}</li>
                  <li>{t('userRights.items.deletion')}</li>
                  <li>{t('userRights.items.portability')}</li>
                  <li>{t('userRights.items.objection')}</li>
                </ul>
                <p className="mt-4 text-sm">
                  {t('userRights.contact')} <a href="mailto:mehmet.apaydin0@outlook.com" className="text-blue-600 hover:underline">mehmet.apaydin0@outlook.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-orange-600" />
                  {t('compliance.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>
                  {t('compliance.description')}
                </p>
                <p className="mt-2">
                  {t('compliance.responsibility')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 text-sm">
                  <strong>Not:</strong> {t('footer.note')}
                </p>
                <p className="text-gray-700 text-sm mt-4">
                  {t('footer.contact')} <a href="mailto:mehmet.apaydin0@outlook.com" className="text-blue-600 hover:underline">mehmet.apaydin0@outlook.com</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
