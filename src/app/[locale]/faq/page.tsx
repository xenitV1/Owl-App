'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const t = useTranslations('faq');
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqKeys = [
    'whatIsOwl',
    'whenLaunch',
    'pricing',
    'aiFeatures',
    'dataSecurity',
    'fileFormats',
    'studyGroups',
    'mobileApp',
    'contentSharing',
    'support'
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
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
            <p className="text-center text-gray-600 mb-8">
              {t('subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {faqKeys.map((key, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => toggleFAQ(index)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t(`questions.${key}.question`)}
                      </h3>
                      {openIndex === index && (
                        <p className="text-gray-600 mt-3 pr-8">
                          {t(`questions.${key}.answer`)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-700 mb-4">
                {t('contactCard.title')}
              </p>
              <Button asChild>
                <a href="mailto:mehmet.apaydin0@outlook.com">
                  {t('contactCard.button')}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
