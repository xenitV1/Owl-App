import React from "react";

interface EchoIconProps {
  className?: string;
  filled?: boolean;
}

export const EchoIcon: React.FC<EchoIconProps> = ({
  className = "h-4 w-4",
  filled = false,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 2.4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Center emitter */}
      <circle
        cx="12"
        cy="12"
        r={filled ? 2.3 : 1.9}
        fill={filled ? "currentColor" : "none"}
      />
      {/* Right waves */}
      <path d="M14 8c2 2 2 6 0 8" />
      <path d="M17 6c3.5 3.5 3.5 10.5 0 14" />
      <path d="M20 4c4 4 4 12 0 16" />
      {/* Left waves */}
      <path d="M10 8c-2 2-2 6 0 8" />
      <path d="M7 6c-3.5 3.5-3.5 10.5 0 14" />
      <path d="M4 4c-4 4-4 12 0 16" />
    </svg>
  );
};
