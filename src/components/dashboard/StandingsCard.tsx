"use client";

import { useState } from "react";
import Flag from "@/components/Flag";
import GroupSelect from "./GroupSelect";

export interface StandingRow {
  code: string;
  name: string;
  w: number;
  d: number;
  l: number;
  pts: number;
}

export default function StandingsCard({
  byGroup,
  initialGroup,
}: {
  byGroup: Record<string, StandingRow[]>;
  initialGroup: string;
}) {
  const [group, setGroup] = useState(initialGroup);
  const rows = byGroup[group] ?? [];

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Group Standing</h2>
        <GroupSelect groups={Object.keys(byGroup)} value={group} onChange={setGroup} />
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem_2.5rem] items-center gap-1 px-2 text-xs text-white/45">
          <span>P</span>
          <span>Team</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-right">pts</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {rows.map((r, i) => (
            <div
              key={r.code}
              className="glass-chip grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem_2.5rem] items-center gap-1 rounded-xl px-2 py-2"
            >
              <span className="tabular text-xs text-white/60">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2">
                <Flag code={r.code} name={r.name} size="sm" />
                <span className="truncate text-sm">{r.name}</span>
              </span>
              <span className="tabular text-center text-sm text-white/80">{r.w}</span>
              <span className="tabular text-center text-sm text-white/80">{r.d}</span>
              <span className="tabular text-center text-sm text-white/80">{r.l}</span>
              <span className="tabular text-right text-sm font-medium">{r.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
