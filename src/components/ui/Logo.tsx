'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };
  
  // Hydration mismatch'i önlemek için basit çözüm
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const currentTheme = mounted ? (resolvedTheme || theme) : 'light';
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'retro-dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} ${
        isDarkTheme
          ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-2 border border-blue-500/20 shadow-lg shadow-blue-500/20'
          : ''
      }`}>
        <Image
          src="/logo.png"
          alt="Owl Logo"
          fill
          className="object-contain"
          priority
          sizes={`${sizeClasses[size]}`}
        />
        {/* Karanlık temalar (dark ve retro-dark) için parıltı efekti */}
        {isDarkTheme && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent rounded-lg pointer-events-none" />
        )}
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} text-foreground ${
          isDarkTheme ? 'drop-shadow-lg' : ''
        }`}>
          Owl
        </span>
      )}
    </div>
  );
}

export default Logo;
