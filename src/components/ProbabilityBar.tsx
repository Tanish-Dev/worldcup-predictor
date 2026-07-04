import type { ReactNode } from "react";

interface ProbabilityBarProps {
  value: number; // 0..1
  label?: ReactNode;
  labelClassName?: string;
  trackHeight?: number;
  muted?: boolean;
}

export default function ProbabilityBar({
  value,
  label,
  labelClassName,
  trackHeight = 8,
  muted = false,
}: ProbabilityBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="flex w-full items-center gap-3">
      {label && (
        <span className={labelClassName ?? "w-24 shrink-0 text-sm text-ink-secondary"}>
          {label}
        </span>
      )}
      <svg
        viewBox={`0 0 100 ${trackHeight}`}
        preserveAspectRatio="none"
        className="h-2 w-full flex-1"
        role="img"
        aria-label={`${pct.toFixed(1)}%`}
      >
        <rect x={0} y={0} width={100} height={trackHeight} rx={4} className="fill-gridline" />
        <rect
          x={0}
          y={0}
          width={pct}
          height={trackHeight}
          rx={4}
          className={muted ? "fill-axis" : "fill-(--seq-500)"}
        />
      </svg>
      <span className="tabular w-12 shrink-0 text-right text-sm text-ink-primary">
        {pct >= 99.95 ? "100%" : pct >= 10 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}
