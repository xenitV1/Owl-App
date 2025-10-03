'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, AlertCircle, Scale, Shield } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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
            <p className="text-center text-gray-600">
              {t('lastUpdate')}
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  {t('general.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-3">
                <p>
                  {t('general.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-green-600" />
                  {t('responsibilities.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('responsibilities.items.accuracy')}</li>
                  <li>{t('responsibilities.items.security')}</li>
                  <li>{t('responsibilities.items.compliance')}</li>
                  <li>{t('responsibilities.items.respect')}</li>
                  <li>{t('responsibilities.items.copyright')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                  {t('prohibited.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>{t('prohibited.description')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('prohibited.items.spam')}</li>
                  <li>{t('prohibited.items.copyright')}</li>
                  <li>{t('prohibited.items.harassment')}</li>
                  <li>{t('prohibited.items.fakeAccounts')}</li>
                  <li>{t('prohibited.items.security')}</li>
                  <li>{t('prohibited.items.unauthorized')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5 text-purple-600" />
                  {t('contentRights.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-3">
                <p>
                  {t('contentRights.userContent')}
                </p>
                <p>
                  {t('contentRights.platformContent')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 text-sm">
                  <strong>{t('footer.important').split(':')[0]}:</strong> {t('footer.important').split(':')[1]}
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
