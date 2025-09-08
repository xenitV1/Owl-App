'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FontSizeToggle } from '@/components/ui/font-size-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { UserProfile } from '@/components/auth/UserProfile';
import { Logo } from '@/components/ui/Logo';
import { Home, Search, Users, User, BookOpen, Droplets, Settings } from 'lucide-react';

export const Navigation: React.FC = () => {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const locale = useLocale();

  const navigation = [
    { name: t('home'), href: `/${locale}`, icon: Home },
    { name: t('discover'), href: `/${locale}/discover`, icon: Search },
    { name: t('following'), href: `/${locale}/following`, icon: Users },
    { name: t('saved'), href: `/${locale}/saved`, icon: Droplets },
    { name: t('profile'), href: `/${locale}/profile`, icon: User },
    { name: t('communities'), href: `/${locale}/communities`, icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Logo size="sm" />
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                             (item.href !== `/${locale}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          <LanguageSwitcher />
          <ThemeToggle />
          <FontSizeToggle />
          <AuthGuard>
            <UserProfile />
          </AuthGuard>
        </div>
      </div>
    </nav>
  );
};