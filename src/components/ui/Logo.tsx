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
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src="/logo.png"
          alt="Owl Logo"
          fill
          className="object-contain"
          priority
          sizes={`${sizeClasses[size]}`}
        />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} text-foreground ${
          ''
        }`}>
          Owl
        </span>
      )}
    </div>
  );
}

export default Logo;