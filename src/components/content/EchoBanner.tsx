"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EchoIcon } from "@/components/icons/EchoIcon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface EchoBannerProps {
  originalAuthor: {
    id: string;
    name: string;
    avatar?: string;
  };
  comment?: string | null;
}

export const EchoBanner: React.FC<EchoBannerProps> = ({
  originalAuthor,
  comment,
}) => {
  const t = useTranslations("posts");
  const router = useRouter();
  const locale = useLocale();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${locale}/profile/${originalAuthor.id}`);
  };

  return (
    <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-muted">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar
              className="h-5 w-5 cursor-pointer hover:ring-2 hover:ring-primary/20"
              onClick={handleUserClick}
            >
              <AvatarImage
                src={originalAuthor.avatar}
                alt={originalAuthor.name}
              />
              <AvatarFallback className="text-[10px]">
                {getInitials(originalAuthor.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {t("originalPost")}{" "}
              <span
                className="font-medium text-foreground hover:underline cursor-pointer"
                onClick={handleUserClick}
              >
                {originalAuthor.name}
              </span>
            </span>
          </div>
          {comment && (
            <p className="text-[13px] mt-2 text-foreground/90 italic leading-snug">
              "{comment}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
