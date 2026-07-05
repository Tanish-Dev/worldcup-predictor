"use client";

import { useState } from "react";
import Flag from "@/components/Flag";
import GroupSelect from "./GroupSelect";

export interface SimStandingRow {
  code: string;
  name: string;
  /** real group-stage points */
  pts: number;
  /** model chance of advancing from the group, 0-100 */
  pct: number;
}

export interface UpcomingMatchInfo {
  dateLabel: string;
  phase: string;
  homeCode: string;
  homeName: string;
  awayCode: string;
  awayName: string;
  /** 0-100 */
  homePct: number;
  drawPct: number;
  awayPct: number;
}

function TeamChip({ code, name, reverse = false }: { code: string; name: string; reverse?: boolean }) {
  return (
    <span
      className={`glass-chip flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 ${
        reverse ? "flex-row-reverse" : ""
      }`}
    >
      <Flag code={code} name={name} size="sm" />
      <span className="truncate text-sm">{name}</span>
    </span>
  );
}

export default function SimulatorCard({
  byGroup,
  initialGroup,
  match,
  nextLabel,
}: {
  byGroup: Record<string, SimStandingRow[]>;
  initialGroup: string;
  match: UpcomingMatchInfo | null;
  nextLabel: string | null;
}) {
  const [group, setGroup] = useState(initialGroup);
  const rows = byGroup[group] ?? [];

  return (
    <div className="glass rounded-[28px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">AI Qualification Simulator</h2>
        <GroupSelect groups={Object.keys(byGroup)} value={group} onChange={setGroup} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {/* Upcoming match */}
        <div className="glass-deep flex flex-col rounded-2xl p-4">
          <p className="text-center text-base font-medium">Upcoming Match</p>
          {match ? (
            <>
              <p className="mx-auto mt-3 rounded-full px-3 py-1 text-xs text-white/60">
                {match.dateLabel} · {match.phase}
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <TeamChip code={match.homeCode} name={match.homeName} />
                <span className="text-xs font-medium text-white/60">VS</span>
                <TeamChip code={match.awayCode} name={match.awayName} reverse />
              </div>
              <div className="mt-4 grid grid-cols-3 text-xs">
                <div>
                  <p className="truncate text-white/70">{match.homeName}</p>
                  <p
                    className={`tabular mt-0.5 font-medium ${
                      match.homePct >= match.awayPct
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(match.homePct)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/70">Draw</p>
                  <p className="tabular mt-0.5 font-medium text-white/50">
                    {Math.round(match.drawPct)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="truncate text-white/70">{match.awayName}</p>
                  <p
                    className={`tabular mt-0.5 font-medium ${
                      match.awayPct > match.homePct
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(match.awayPct)}%
                  </p>
                </div>
              </div>
              <div className="mt-2 flex h-1.5 gap-1 overflow-hidden rounded-full">
                <span
                  className={`rounded-full ${
                    match.homePct >= match.awayPct
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${match.homePct}%` }}
                />
                {match.drawPct > 0.5 && (
                  <span
                    className="rounded-full bg-white/25"
                    style={{ width: `${match.drawPct}%` }}
                  />
                )}
                <span
                  className={`rounded-full ${
                    match.awayPct > match.homePct
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${match.awayPct}%` }}
                />
              </div>
              {nextLabel && (
                <p className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-white/40">
                  Next · {nextLabel}
                </p>
              )}
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-white/50">
              No matches left to play — the trophy has been lifted.
            </p>
          )}
        </div>

        {/* Simulated standings */}
        <div className="glass-deep rounded-2xl p-4">
          <p className="text-center text-base font-medium">Simulated Standings</p>
          <div className="mt-3 space-y-2">
            {rows.map((r) => (
              <div
                key={r.code}
                className="glass-chip flex items-center gap-2.5 rounded-xl px-3 py-2"
              >
                <Flag code={r.code} name={r.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                <span className="tabular text-xs text-white/60">{r.pts} pts ·</span>
                <span className="tabular w-9 text-right text-sm font-medium">
                  {Math.round(r.pct)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
