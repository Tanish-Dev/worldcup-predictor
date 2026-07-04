import type { ReactNode } from "react";

function Base({
  children,
  className = "h-4 w-4",
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function SlidersIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </Base>
  );
}

export function RefreshIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </Base>
  );
}

export function ExpandIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </Base>
  );
}

export function GaugeIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 14l3.5-3.5" />
      <path d="M20.3 17.7a9 9 0 1 0-16.6 0" />
    </Base>
  );
}

export function TargetIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Base>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Base>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Base>
  );
}

export function SparklesIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M11 4l1.7 4.6L17 10.3l-4.3 1.7L11 16.6l-1.7-4.6L5 10.3l4.3-1.7z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
    </Base>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M8 21h8M12 17v4" />
      <path d="M7 3h10v7a5 5 0 0 1-10 0z" />
      <path d="M7 5H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4" />
    </Base>
  );
}

export function BallIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path
        d="M12 8.2l3.6 2.6-1.4 4.2h-4.4l-1.4-4.2z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  );
}
