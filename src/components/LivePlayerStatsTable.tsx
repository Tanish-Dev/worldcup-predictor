"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Flag from "./Flag";

export interface LivePlayerRow {
  name: string;
  teamCode: string;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

type SortKey = "goals" | "assists" | "cards" | "name";

export default function LivePlayerStatsTable({ rows }: { rows: LivePlayerRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("goals");

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    switch (sortKey) {
      case "assists":
        sorted.sort((a, b) => b.assists - a.assists || b.goals - a.goals);
        break;
      case "cards":
        sorted.sort(
          (a, b) =>
            b.redCards - a.redCards ||
            b.yellowCards - a.yellowCards ||
            b.goals - a.goals,
        );
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "goals":
      default:
        sorted.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
    }
    return sorted;
  }, [rows, query, sortKey]);

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players or teams..."
          className="glass-chip rounded-full px-4 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <span className="text-sm text-ink-muted">
          {filtered.length.toLocaleString()} players &middot; 2026 so far
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-muted">
              <th className="py-3 pr-4 font-normal">#</th>
              <SortableHeader
                label="Player"
                active={sortKey === "name"}
                onClick={() => setSortKey("name")}
              />
              <th className="py-3 pr-4 font-normal">Team</th>
              <SortableHeader
                label="Goals"
                active={sortKey === "goals"}
                onClick={() => setSortKey("goals")}
              />
              <SortableHeader
                label="Assists"
                active={sortKey === "assists"}
                onClick={() => setSortKey("assists")}
              />
              <SortableHeader
                label="Cards"
                active={sortKey === "cards"}
                onClick={() => setSortKey("cards")}
              />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={`${p.name}-${p.teamCode}`} className="border-b border-border/60">
                <td className="tabular py-3 pr-4 text-ink-muted">{i + 1}</td>
                <td className="py-3 pr-4 font-medium">{p.name}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/teams/${p.teamCode.toLowerCase()}`}
                    className="flex items-center gap-2 hover:text-(--seq-500)"
                  >
                    <Flag code={p.teamCode} name={p.teamName} size="sm" />
                    <span className="text-ink-secondary">{p.teamName}</span>
                  </Link>
                </td>
                <td className="tabular py-3 pr-4 font-medium">{p.goals}</td>
                <td className="tabular py-3 pr-4 text-ink-secondary">{p.assists}</td>
                <td className="py-3 pr-4">
                  {p.yellowCards > 0 && (
                    <span className="tabular mr-2 text-(--status-warning)">
                      {p.yellowCards}Y
                    </span>
                  )}
                  {p.redCards > 0 && (
                    <span className="tabular text-(--status-critical)">{p.redCards}R</span>
                  )}
                  {p.yellowCards === 0 && p.redCards === 0 && (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-muted">
                  No players match that search.
                </td>
              </tr>
            )}
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
