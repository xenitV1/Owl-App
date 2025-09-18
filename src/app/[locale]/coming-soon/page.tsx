'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import {
  Clock,
  Mail,
  Zap
} from 'lucide-react';

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');


  // Simple light theme styles
  const styles = {
    background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    card: 'bg-white border-gray-200',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  };

  return (
    <div className={`min-h-screen ${styles.background} transition-all duration-500 overflow-hidden`}>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            {/* Main Logo */}
            <div className="flex justify-center mb-8">
              <Logo size="xl" showText={false} />
            </div>
            
            <Badge variant="secondary" className="mb-4 text-sm bg-white/20 text-white border-white/30">
              🎓 {t('badge')}
            </Badge>
            
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${styles.text} transition-all duration-500`}>
              {t('title')}
              <span className="text-blue-600"> {t('titleHighlight')}</span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${styles.textMuted} transition-all duration-500`}>
              {t('subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className={`text-lg px-8 py-4 ${styles.button} transition-all duration-500`} disabled>
                <Mail className="mr-2 h-5 w-5" />
                {t('notifyButton')} (Coming Soon)
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10">
                <Clock className="mr-2 h-5 w-5" />
                {t('demoButton')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>


      {/* Features Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${styles.text} transition-all duration-500`}>
              {t('features.title')}
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${styles.textMuted} transition-all duration-500`}>
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Zap,
                titleKey: 'features.fast.title',
                descriptionKey: 'features.fast.description'
              },
              {
                icon: Clock,
                titleKey: 'features.comingSoon.title',
                descriptionKey: 'features.comingSoon.description'
              }
            ].map((feature, index) => (
              <Card key={index} className={`hover:shadow-lg transition-all duration-500 ${styles.card} border`}>
                <CardContent className="p-6">
                  <feature.icon className={`h-12 w-12 text-blue-600 mb-4`} />
                  <h3 className={`text-xl font-semibold mb-2 ${styles.text} transition-all duration-500`}>
                    {t(feature.titleKey)}
                  </h3>
                  <p className={`${styles.textMuted} transition-all duration-500`}>
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('cta.subtitle')}
          </p>
          
          <div className="max-w-md mx-auto text-center">
            <p className="text-xl mb-6 opacity-90">
              🚀 {t('cta.title')}
            </p>
            <p className="text-sm opacity-75">
              {t('cta.disclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <Logo size="md" className="text-white" />
          </div>
          <p className="text-gray-400 mb-4">
            {t('footer.tagline')}
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white">{t('footer.about')}</a>
            <a href="#" className="hover:text-white">{t('footer.contact')}</a>
            <a href="#" className="hover:text-white">{t('footer.privacy')}</a>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
