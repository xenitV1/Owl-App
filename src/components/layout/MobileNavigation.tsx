"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Users,
  User,
  BookOpen,
  Droplets,
  Settings,
  MessageCircle,
} from "lucide-react";

export const MobileNavigation: React.FC = () => {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const locale = useLocale();

  const navigation = [
    { name: t("home"), href: `/${locale}`, icon: Home },
    { name: t("discover"), href: `/${locale}/discover`, icon: Search },
    { name: t("following"), href: `/${locale}/following`, icon: Users },
    { name: t("saved"), href: `/${locale}/saved`, icon: Droplets },
    { name: t("profile"), href: `/${locale}/profile`, icon: User },
    { name: t("communities"), href: `/${locale}/communities`, icon: BookOpen },
    { name: t("chat"), href: `/${locale}/chat`, icon: MessageCircle },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 px-3 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Chat Button */}
        <button
          onClick={() => {
            const event = new CustomEvent("toggle-chat-panel");
            window.dispatchEvent(event);
          }}
          className="flex flex-col items-center justify-center space-y-1 px-3 py-2 text-xs font-medium transition-colors text-muted-foreground"
          title="Open Chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Chat</span>
        </button>
      </div>
    </nav>
  );
};
