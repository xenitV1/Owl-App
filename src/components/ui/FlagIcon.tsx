"use client";

import React from "react";

type FlagIconProps = {
  countryCode?: string | null;
  className?: string;
  title?: string;
};

// Renders a vector flag using the country-flag-icons package (SVG sprites)
// Falls back to regional-indicator emoji only if SVG not available or code invalid
export function FlagIcon({ countryCode, className, title }: FlagIconProps) {
  const code = countryCode?.toUpperCase?.() || "";

  // Primary: load SVG from jsDelivr CDN (package provides static files at this path)
  const src = `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${code}.svg`;

  const [error, setError] = React.useState(false);

  // Fallback text computed once
  const base = 127397;
  const chars = React.useMemo(
    () =>
      Array.from(code)
        .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
        .join(""),
    [code],
  );

  const isValid = /^[A-Z]{2}$/.test(code);
  if (!isValid) {
    return null;
  }

  return error ? (
    <span className={className} aria-label={title || code}>
      {chars}
    </span>
  ) : (
    <img
      src={src}
      alt={title || code}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

export default FlagIcon;
