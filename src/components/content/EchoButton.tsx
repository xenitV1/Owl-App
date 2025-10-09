"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EchoIcon } from "@/components/icons/EchoIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { Zap, MessageSquare } from "lucide-react";

interface EchoButtonProps {
  echoCount: number;
  isEchoed?: boolean;
  onQuickEcho: () => void;
  onQuoteEcho: () => void;
  onRemoveEcho?: () => void;
  isLoading?: boolean;
}

export const EchoButton: React.FC<EchoButtonProps> = ({
  echoCount,
  isEchoed = false,
  onQuickEcho,
  onQuoteEcho,
  onRemoveEcho,
  isLoading = false,
}) => {
  const t = useTranslations("echo");
  const [isAnimating, setIsAnimating] = useState(false);
  const echoSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize echo sound
  useEffect(() => {
    echoSoundRef.current = new Audio("/api/sounds/pool-vote.mp3"); // Using pool sound temporarily
    echoSoundRef.current.volume = 0.4;
    echoSoundRef.current.preload = "auto";
    echoSoundRef.current.load();
  }, []);

  const playEchoSound = () => {
    if (echoSoundRef.current) {
      echoSoundRef.current.currentTime = 0;
      echoSoundRef.current.play().catch(() => {});
    }
  };

  const handleQuickEcho = () => {
    setIsAnimating(true);
    playEchoSound();
    onQuickEcho();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleQuoteEcho = () => {
    playEchoSound();
    onQuoteEcho();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isEchoed ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-1 px-2 py-1 h-auto group"
          disabled={isLoading}
        >
          <EchoIcon
            className={`transition-all duration-200 ${
              isAnimating
                ? "scale-125 rotate-12"
                : isEchoed
                  ? "scale-110"
                  : "scale-100 opacity-70 group-hover:opacity-100"
            }`}
            filled={isEchoed}
          />
          <span
            className={`text-xs transition-all duration-200 ${
              isAnimating ? "scale-110 font-bold" : ""
            }`}
          >
            {echoCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isEchoed ? (
          <DropdownMenuItem
            onClick={() => {
              onRemoveEcho?.();
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 300);
            }}
            disabled={isLoading}
            className="cursor-pointer text-destructive"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("removeEcho")}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={handleQuickEcho}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t("quickEcho")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleQuoteEcho}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t("quoteEcho")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
