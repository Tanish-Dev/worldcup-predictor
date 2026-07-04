"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Team, TeamStatus } from "@/lib/types";
import { CONFEDERATION_ORDER } from "@/lib/confederations";
import Flag from "./Flag";
import StatusPill from "./StatusPill";
import ProbabilityBar from "./ProbabilityBar";

export interface RankingRow extends Team {
  status: TeamStatus;
  liveChampion: number;
}

type SortKey = "live" | "power" | "fifaRank" | "preOdds" | "name";

export default function RankingsTable({ rows }: { rows: RankingRow[] }) {
  const [query, setQuery] = useState("");
  const [confederation, setConfederation] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("live");

  const filtered = useMemo(() => {
    let out = rows;
    if (confederation) out = out.filter((t) => t.confederation === confederation);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((t) => t.name.toLowerCase().includes(q));
    }
    const sorted = [...out];
    switch (sortKey) {
      case "power":
        sorted.sort((a, b) => b.powerRating - a.powerRating);
        break;
      case "fifaRank":
        sorted.sort((a, b) => a.fifaRank - b.fifaRank);
        break;
      case "preOdds":
        sorted.sort((a, b) => b.predictions.champion - a.predictions.champion);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "live":
      default:
        sorted.sort(
          (a, b) =>
            b.liveChampion - a.liveChampion ||
            b.predictions.champion - a.predictions.champion,
        );
    }
    return sorted;
  }, [rows, query, confederation, sortKey]);

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams..."
          className="glass-chip rounded-full px-4 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfederation(null)}
            className={
              confederation === null
                ? "rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium"
                : "rounded-full px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary"
            }
          >
            All
          </button>
          {CONFEDERATION_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConfederation(c)}
              className={
                confederation === c
                  ? "rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium"
                  : "rounded-full px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary"
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-215 border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-muted">
              <th className="py-3 pr-4 font-normal">#</th>
              <SortableHeader label="Team" active={sortKey === "name"} onClick={() => setSortKey("name")} />
              <th className="py-3 pr-4 font-normal">Status</th>
              <SortableHeader
                label="FIFA rank"
                active={sortKey === "fifaRank"}
                onClick={() => setSortKey("fifaRank")}
              />
              <SortableHeader
                label="Power"
                active={sortKey === "power"}
                onClick={() => setSortKey("power")}
              />
              <SortableHeader
                label="Pre-tournament"
                active={sortKey === "preOdds"}
                onClick={() => setSortKey("preOdds")}
              />
              <SortableHeader
                label="Title odds now"
                active={sortKey === "live"}
                onClick={() => setSortKey("live")}
              />
            </tr>
          </thead>
          <tbody>
            {filtered.map((team, i) => {
              const out = team.status.kind === "eliminated";
              return (
                <tr key={team.code} className="border-b border-border/60">
                  <td className="tabular py-3 pr-4 text-ink-muted">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/teams/${team.code.toLowerCase()}`}
                      className="flex items-center gap-2.5 hover:text-(--seq-500)"
                    >
                      <Flag
                        code={team.code}
                        name={team.name}
                        size="sm"
                        className={out ? "opacity-50 grayscale" : ""}
                      />
                      <span className={out ? "text-ink-muted" : "font-medium"}>
                        {team.name}
                      </span>
                      {team.isHost && (
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-secondary">
                          Host
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill status={team.status} />
                  </td>
                  <td className="tabular py-3 pr-4 text-ink-secondary">#{team.fifaRank}</td>
                  <td className="tabular py-3 pr-4 text-ink-secondary">
                    {team.powerRating.toFixed(2)}
                  </td>
                  <td className="tabular py-3 pr-4 text-ink-secondary">
                    {(team.predictions.champion * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4">
                    {out ? (
                      <span className="text-xs text-ink-muted">—</span>
                    ) : (
                      <ProbabilityBar value={team.liveChampion} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="py-3 pr-4 font-normal">
      <button
        type="button"
        onClick={onClick}
        className={active ? "font-medium text-ink-primary" : "text-ink-muted hover:text-ink-primary"}
      >
        {label}
      </button>
    </th>
  );
}
