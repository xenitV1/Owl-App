'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Clock,
  Mail,
  Zap,
  BookOpen,
  Users,
  FolderOpen,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme-aware styles
  const getThemeStyles = () => {
    switch (resolvedTheme) {
      case 'dark':
        return {
          background: 'bg-gradient-to-br from-gray-900 to-gray-800',
          text: 'text-white',
          textMuted: 'text-gray-300',
          card: 'bg-gray-800 border-gray-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
        };
      case 'retro-light':
        return {
          background: 'bg-gradient-to-br from-amber-50 to-orange-100',
          text: 'text-amber-900',
          textMuted: 'text-amber-700',
          card: 'bg-amber-50 border-amber-200',
          button: 'bg-amber-600 hover:bg-amber-700 text-amber-50',
          input: 'bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-600'
        };
      case 'retro-dark':
        return {
          background: 'bg-gradient-to-br from-amber-900 to-orange-900',
          text: 'text-amber-50',
          textMuted: 'text-amber-200',
          card: 'bg-amber-800 border-amber-700',
          button: 'bg-amber-600 hover:bg-amber-700 text-amber-50',
          input: 'bg-amber-800 border-amber-600 text-amber-50 placeholder-amber-300'
        };
      default: // light
        return {
          background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
          text: 'text-gray-900',
          textMuted: 'text-gray-600',
          card: 'bg-white border-gray-200',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        };
    }
  };

  const styles = getThemeStyles();

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu, lütfen tekrar deneyin' });
    } finally {
      setIsLoading(false);
    }
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
              <Button size="lg" className={`text-lg px-8 py-4 ${styles.button} transition-all duration-500`}>
                <Mail className="mr-2 h-5 w-5" />
                {t('notifyButton')}
              </Button>
              <Button variant="outline" size="lg" className={`text-lg px-8 py-4 border-2 ${styles.text} hover:bg-opacity-10 transition-all duration-500`}>
                <Clock className="mr-2 h-5 w-5" />
                {t('demoButton')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        {resolvedTheme === 'dark' ? (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gray-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </>
        ) : resolvedTheme?.startsWith('retro') ? (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </>
        )}
      </section>


      {/* Work Environment Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${styles.text} transition-all duration-500`}>
              {t('workEnvironment.title')}
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${styles.textMuted} transition-all duration-500`}>
              {t('workEnvironment.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                titleKey: 'workEnvironment.features.focused.title',
                descriptionKey: 'workEnvironment.features.focused.description'
              },
              {
                icon: Users,
                titleKey: 'workEnvironment.features.collaborative.title',
                descriptionKey: 'workEnvironment.features.collaborative.description'
              },
              {
                icon: FolderOpen,
                titleKey: 'workEnvironment.features.organized.title',
                descriptionKey: 'workEnvironment.features.organized.description'
              },
              {
                icon: BookOpen,
                titleKey: 'workEnvironment.features.productive.title',
                descriptionKey: 'workEnvironment.features.productive.description'
              }
            ].map((feature, index) => (
              <Card key={index} className={`hover:shadow-lg transition-all duration-500 ${styles.card} border`}>
                <CardContent className="p-6 text-center">
                  <feature.icon className={`h-12 w-12 text-blue-600 mb-4 mx-auto`} />
                  <h3 className={`text-lg font-semibold mb-3 ${styles.text} transition-all duration-500`}>
                    {t(feature.titleKey)}
                  </h3>
                  <p className={`text-sm ${styles.textMuted} transition-all duration-500`}>
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-gray-50">
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

      {/* Waitlist Section */}
      <section className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gray-800' : resolvedTheme?.startsWith('retro') ? 'bg-amber-100' : 'bg-blue-600'} text-white`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('cta.subtitle')}
          </p>
          
          <div className="max-w-md mx-auto">
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-left block text-sm font-medium">
                  E-posta Adresi *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('cta.emailPlaceholder')}
                  className={styles.input}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className={`w-full ${styles.button} transition-all duration-500`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('cta.notifyButton')}
                  </>
                )}
              </Button>
              
              {message && (
                <div className={`flex items-center justify-center space-x-2 p-3 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
              
              <p className="text-sm opacity-75">
                {t('cta.disclaimer')}
              </p>
            </form>
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
