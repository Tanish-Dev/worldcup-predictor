"use client";

import { useState } from "react";
import Flag from "@/components/Flag";
import GroupSelect from "./GroupSelect";

export interface InsightRow {
  code: string;
  name: string;
  /** 0-100 */
  pct: number;
  out: boolean;
}

export default function InsightsCard({
  byGroup,
  initialGroup,
  milestone,
}: {
  byGroup: Record<string, InsightRow[]>;
  initialGroup: string;
  milestone: string;
}) {
  const [group, setGroup] = useState(initialGroup);
  const rows = byGroup[group] ?? [];

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium">Progression Probability</p>
          <p className="mt-0.5 text-xs font-light text-white/50">
            Chance to reach the {milestone} · synced live
          </p>
        </div>
        <GroupSelect groups={Object.keys(byGroup)} value={group} onChange={setGroup} />
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.code}
            className={`glass-chip flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
              r.out ? "opacity-40" : ""
            }`}
          >
            <Flag code={r.code} name={r.name} size="sm" />
            <span className="w-24 shrink-0 truncate text-sm">{r.name}</span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-white"
                style={{ width: `${r.out ? 0 : r.pct}%` }}
              />
            </span>
            <span className="tabular w-10 shrink-0 text-right text-sm">
              {r.out ? "OUT" : `${Math.round(r.pct)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
