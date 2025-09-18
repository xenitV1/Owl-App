'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { 
  Palette, 
  Sun, 
  Moon, 
  Zap,
  Clock,
  Mail,
  Users,
  BookOpen,
  TrendingUp,
  Globe,
  Globe2
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'retro-light' | 'retro-dark';

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('light');

  const themes = [
    { id: 'light' as Theme, name: 'Light', icon: Sun, description: t('themes.light') },
    { id: 'dark' as Theme, name: 'Dark', icon: Moon, description: t('themes.dark') },
    { id: 'retro-light' as Theme, name: 'Retro Light', icon: Zap, description: t('themes.retroLight') },
    { id: 'retro-dark' as Theme, name: 'Retro Dark', icon: Zap, description: t('themes.retroDark') }
  ];

  const stats = [
    { label: t('stats.users'), value: '50,000+', icon: Users },
    { label: t('stats.content'), value: '100,000+', icon: BookOpen },
    { label: t('stats.schools'), value: '1,000+', icon: Globe },
    { label: t('stats.success'), value: '95%', icon: TrendingUp }
  ];

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'retro-light', 'retro-dark');
    document.documentElement.classList.add(theme);
  };

  const getThemeStyles = () => {
    switch (selectedTheme) {
      case 'dark':
        return {
          background: 'bg-gradient-to-br from-gray-900 to-gray-800',
          text: 'text-white',
          textMuted: 'text-gray-300',
          card: 'bg-gray-800 border-gray-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'retro-light':
        return {
          background: 'bg-gradient-to-br from-[#E7E1CB] to-[#D4C4A8]',
          text: 'text-[#2D1B1B]',
          textMuted: 'text-[#5A4A3A]',
          card: 'bg-[#F5F0E8] border-[#B8A082]',
          button: 'bg-[#D39A09] hover:bg-[#B8870A] text-[#2D1B1B]'
        };
      case 'retro-dark':
        return {
          background: 'bg-gradient-to-br from-[#1A1612] to-[#2D2520]',
          text: 'text-[#F5F0E8]',
          textMuted: 'text-[#B8A082]',
          card: 'bg-[#2D2520] border-[#4A3F38]',
          button: 'bg-[#FBCD43] hover:bg-[#E6B83A] text-[#1A1612]'
        };
      default: // light
        return {
          background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
          text: 'text-gray-900',
          textMuted: 'text-gray-600',
          card: 'bg-white border-gray-200',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`min-h-screen ${styles.background} transition-all duration-500 overflow-hidden`}>
      {/* Theme Selector & Language Switcher */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {/* Language Switcher */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Globe2 className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">{t('language')}</span>
          </div>
          <LanguageSwitcher />
        </div>
        
        {/* Theme Selector */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">{t('theme')}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-2 rounded text-xs transition-all ${
                  selectedTheme === theme.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={theme.description}
              >
                <theme.icon className="h-3 w-3 mx-auto mb-1" />
                <div className="text-xs">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

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

      {/* Stats Section */}
      <section className={`py-16 ${styles.card} transition-all duration-500`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className={`text-3xl font-bold ${styles.text} transition-all duration-500`}>
                  {stat.value}
                </div>
                <div className={`${styles.textMuted} transition-all duration-500`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: BookOpen,
                titleKey: 'features.noteSharing.title',
                descriptionKey: 'features.noteSharing.description'
              },
              {
                icon: Users,
                titleKey: 'features.collaborative.title',
                descriptionKey: 'features.collaborative.description'
              },
              {
                icon: TrendingUp,
                titleKey: 'features.smartDiscovery.title',
                descriptionKey: 'features.smartDiscovery.description'
              },
              {
                icon: Globe,
                titleKey: 'features.global.title',
                descriptionKey: 'features.global.description'
              },
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
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder={t('cta.emailPlaceholder')}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Mail className="mr-2 h-5 w-5" />
                {t('cta.notifyButton')}
              </Button>
            </div>
            <p className="text-sm mt-4 opacity-75">
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
        
        /* Retro theme specific styles */
        .retro-light, .retro-dark {
          font-family: 'Space Grotesk', 'Courier New', monospace;
        }
        
        .retro-light button,
        .retro-dark button {
          position: relative;
          transition: all 0.1s ease;
          box-shadow: 3px 3px 0 0 var(--border);
        }
        
        .retro-light button:active,
        .retro-dark button:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0 0 var(--border);
        }
        
        .retro-light .card,
        .retro-dark .card {
          box-shadow: 3px 3px 0 0 var(--border);
          border: 2px solid var(--border);
        }
      `}</style>
    </div>
  );
}
