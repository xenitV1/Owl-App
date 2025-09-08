'use client';

import { useEffect, useRef, useState } from 'react';

// Accessibility utility functions and hooks

// Keyboard navigation support
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onTab?: () => void,
) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        onSpace?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
      case 'Tab':
        onTab?.();
        break;
    }
  };

  return { handleKeyDown };
};

// Focus management utilities
export class FocusManager {
  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  static restoreFocus(element: HTMLElement): void {
    element.focus();
  }

  static moveToNextTabbableElement(currentElement: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex].focus();
  }

  static moveToPreviousTabbableElement(currentElement: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex].focus();
  }
}

// Screen reader announcements
export const useAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    
    // Clear after announcement
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  };

  return { announce, announcement };
};

export const Announcer = ({ message, priority = 'polite' }: { message: string; priority?: 'polite' | 'assertive' }) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {message}
  </div>
);

// Color contrast utilities
export const ColorContrast = {
  calculateLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  getContrastRatio(color1: string, color2: string): number {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  meetsWCAGAA(contrastRatio: number): boolean {
    return contrastRatio >= 4.5;
  },

  meetsWCAGAAA(contrastRatio: number): boolean {
    return contrastRatio >= 7;
  }
};

// Reduced motion support
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Screen reader detection
export const useScreenReader = () => {
  const [usingScreenReader, setUsingScreenReader] = useState(false);

  useEffect(() => {
    // Simple detection based on common screen reader patterns
    const detectScreenReader = () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-hidden', 'true');
      testElement.textContent = 'test';
      document.body.appendChild(testElement);

      const isHidden = testElement.getAttribute('aria-hidden') === 'true';
      document.body.removeChild(testElement);

      setUsingScreenReader(isHidden);
    };

    detectScreenReader();
  }, []);

  return usingScreenReader;
};

// High contrast mode detection
export const useHighContrast = () => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return highContrast;
};

// ARIA attribute utilities
export const ARIA = {
  // Common ARIA attributes
  getExpandedAttributes(isExpanded: boolean) {
    return {
      'aria-expanded': isExpanded,
      'aria-selected': isExpanded
    };
  },

  getPressedAttributes(isPressed: boolean) {
    return {
      'aria-pressed': isPressed
    };
  },

  getCheckedAttributes(isChecked: boolean) {
    return {
      'aria-checked': isChecked
    };
  },

  getDisabledAttributes(isDisabled: boolean) {
    return {
      'aria-disabled': isDisabled,
      disabled: isDisabled
    };
  },

  getBusyAttributes(isBusy: boolean) {
    return {
      'aria-busy': isBusy
    };
  },

  // Role-specific attributes
  getDialogAttributes(isModal: boolean = false) {
    return {
      role: 'dialog',
      'aria-modal': isModal,
      'aria-labelledby': 'dialog-title',
      'aria-describedby': 'dialog-description'
    };
  },

  getAlertAttributes() {
    return {
      role: 'alert',
      'aria-live': 'assertive'
    };
  },

  getStatusAttributes() {
    return {
      role: 'status',
      'aria-live': 'polite'
    };
  },

  getNavigationAttributes() {
    return {
      role: 'navigation',
      'aria-label': 'Main navigation'
    };
  },

  getSearchAttributes() {
    return {
      role: 'search',
      'aria-label': 'Search'
    };
  }
};

// Skip link component
export const SkipLinks = ({ links }: { links: Array<{ href: string; label: string }> }) => (
  <nav
    aria-label="Skip links"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50"
    suppressHydrationWarning
    translate="no"
    data-no-translate
  >
    {links.map((link, index) => (
      <a
        key={index}
        href={link.href}
        className="block px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        suppressHydrationWarning
        translate="no"
        data-no-translate
      >
        {link.label}
      </a>
    ))}
  </nav>
);

// Form accessibility utilities
export const FormAccessibility = {
  getErrorAttributes(hasError: boolean, errorMessage?: string) {
    return {
      'aria-invalid': hasError,
      'aria-describedby': hasError && errorMessage ? 'error-message' : undefined,
      'aria-required': true
    };
  },

  getFieldAttributes(label: string, isRequired: boolean = false) {
    return {
      'aria-label': label,
      'aria-required': isRequired,
      required: isRequired
    };
  },

  getGroupAttributes(label: string) {
    return {
      role: 'group',
      'aria-label': label
    };
  }
};

// Landmark regions
export const Landmarks = {
  Main: ({ children }: { children: React.ReactNode }) => (
    <main role="main" aria-label="Main content">
      {children}
    </main>
  ),

  Navigation: ({ children, label = 'Main navigation' }: { children: React.ReactNode; label?: string }) => (
    <nav role="navigation" aria-label={label}>
      {children}
    </nav>
  ),

  Complementary: ({ children, label = 'Additional information' }: { children: React.ReactNode; label?: string }) => (
    <aside role="complementary" aria-label={label}>
      {children}
    </aside>
  ),

  ContentInfo: ({ children }: { children: React.ReactNode }) => (
    <footer role="contentinfo">
      {children}
    </footer>
  ),

  Search: ({ children }: { children: React.ReactNode }) => (
    <section role="search" aria-label="Search">
      {children}
    </section>
  ),

  Banner: ({ children }: { children: React.ReactNode }) => (
    <header role="banner">
      {children}
    </header>
  )
};

// Accessibility testing utilities
export const AccessibilityTesting = {
  checkAltText(): { passed: boolean; issues: string[] } {
    const images = document.querySelectorAll('img');
    const issues: string[] = [];

    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} missing alt text or aria-label`);
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  },

  checkHeadingStructure(): { passed: boolean; issues: string[] } {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues: string[] = [];
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push(`Heading level skipped from h${lastLevel} to h${level}`);
      }
      
      lastLevel = level;
    });

    return {
      passed: issues.length === 0,
      issues
    };
  },

  checkFocusableElements(): { passed: boolean; issues: string[] } {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const issues: string[] = [];

    focusableElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      
      if (htmlElement.tabIndex < 0) {
        issues.push(`Element ${index + 1} has negative tabindex`);
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }
};