import type { TeamStatus } from "@/lib/types";

export default function StatusPill({ status }: { status: TeamStatus }) {
  if (status.kind === "champion") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-(--seq-500) px-2.5 py-0.5 text-xs font-medium text-white">
        Champion
      </span>
    );
  }
  if (status.kind === "alive") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-(--status-good)">
        <span className="h-1.5 w-1.5 rounded-full bg-(--status-good)" />
        In {status.phase}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-ink-muted">
      Out — {status.phase}
    </span>
  );
}
