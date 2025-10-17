import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { getCountryFlagUrl } from "@/lib/utils";

type FlagAvatarProps = {
  name?: string;
  country?: string | null;
  fallbackAvatar?: string | null;
  className?: string;
};

// Opt-in avatar that uses country flag image when available
export function FlagAvatar({
  name,
  country,
  fallbackAvatar,
  className,
}: FlagAvatarProps) {
  const initials = React.useMemo(() => {
    return (
      (name || "")
        .split(" ")
        .map((w) => w.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    );
  }, [name]);

  const src = getCountryFlagUrl(country) || undefined;

  return (
    <Avatar className={className}>
      <AvatarImage
        src={src}
        alt={name || country || "Country"}
        className="object-cover"
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export default FlagAvatar;
