'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation, FocusManager } from '@/lib/accessibility';
import { ChevronDown, Menu, X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  description?: string;
  children?: NavItem[];
  icon?: React.ReactNode;
}

interface AccessibleNavigationProps {
  items: NavItem[];
  className?: string;
  'aria-label'?: string;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  className,
  'aria-label': ariaLabel = 'Main navigation'
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Close mobile menu on escape key
  const { handleKeyDown: handleEscapeKey } = useKeyboardNavigation(
    undefined,
    undefined,
    () => setIsMobileMenuOpen(false)
  );

  // Focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && navRef.current) {
      const cleanup = FocusManager.trapFocus(navRef.current);
      return cleanup;
    }
  }, [isMobileMenuOpen]);

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({ 
    item, 
    level = 0 
  }) => {
    const isExpanded = expandedItems.has(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);

    const { handleKeyDown } = useKeyboardNavigation(
      undefined,
      hasChildren ? () => toggleExpanded(item.href) : undefined,
      undefined,
      hasChildren ? () => {
        const newExpanded = new Set(expandedItems);
        newExpanded.delete(item.href);
        setExpandedItems(newExpanded);
      } : undefined,
      hasChildren ? () => {
        const newExpanded = new Set(expandedItems);
        newExpanded.add(item.href);
        setExpandedItems(newExpanded);
      } : undefined
    );

    return (
      <div className="relative">
        <div
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            level > 0 && 'ml-4'
          )}
          role={hasChildren ? 'button' : 'link'}
          tabIndex={0}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-haspopup={hasChildren ? 'menu' : undefined}
          aria-current={active ? 'page' : undefined}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.href);
            }
          }}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {item.description && (
          <div className="sr-only" id={`${item.href}-description`}>
            {item.description}
          </div>
        )}

            {item.children && isExpanded && (
              <div
                role="menu"
                aria-label={`${item.label} submenu`}
                className="mt-1 space-y-1"
              >
                {item.children.map((child) => (
                  <NavItemComponent
                    key={child.href}
                    item={child}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
      </div>
    );
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Skip to main content
      </a>

      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        onKeyDown={handleEscapeKey}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Desktop navigation */}
      <nav
        ref={navRef}
        aria-label={ariaLabel}
        className={cn('hidden md:block', className)}
      >
        <ul className="space-y-1" role="menubar">
          {items.map((item) => (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                role="menuitem"
                aria-current={isActive(item.href) ? 'page' : undefined}
                aria-describedby={item.description ? `${item.href}-description` : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
              {item.description && (
                <div className="sr-only" id={`${item.href}-description`}>
                  {item.description}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation"
          ref={navRef}
          aria-label={ariaLabel}
          className="md:hidden mt-4 p-4 border rounded-lg bg-background"
        >
          <div className="space-y-1">
            {items.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </nav>
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isMobileMenuOpen ? 'Navigation menu opened' : 'Navigation menu closed'}
      </div>
    </>
  );
};

// Breadcrumb navigation component
interface BreadcrumbItem {
  href: string;
  label: string;
  current?: boolean;
}

interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const AccessibleBreadcrumb: React.FC<AccessibleBreadcrumbProps> = ({
  items,
  className
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground" aria-hidden="true">
                /
              </span>
            )}
            {item.current ? (
              <span
                className="text-foreground font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};