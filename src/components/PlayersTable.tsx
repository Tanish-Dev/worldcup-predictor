"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerStat, Team } from "@/lib/types";
import Flag from "./Flag";

type SortKey = "goals" | "name" | "tournaments";

const DEFAULT_LIMIT = 50;

export default function PlayersTable({
  players,
  teams,
}: {
  players: PlayerStat[];
  teams: Team[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [showAll, setShowAll] = useState(false);

  const teamByName = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teams) map.set(t.name.toLowerCase(), t);
    return map;
  }, [teams]);

  const filtered = useMemo(() => {
    let out = players;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    switch (sortKey) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "tournaments":
        sorted.sort(
          (a, b) => b.tournaments.length - a.tournaments.length || b.goals - a.goals,
        );
        break;
      case "goals":
      default:
        sorted.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
    }
    return sorted;
  }, [players, query, sortKey]);

  const visible = showAll || query.trim() ? filtered : filtered.slice(0, DEFAULT_LIMIT);

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
          {filtered.length.toLocaleString()} scorers &middot; 1930-2022
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
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
                label="World Cups"
                active={sortKey === "tournaments"}
                onClick={() => setSortKey("tournaments")}
              />
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => {
              const team = teamByName.get(p.team.toLowerCase());
              return (
                <tr key={`${p.name}-${p.team}`} className="border-b border-border/60">
                  <td className="tabular py-3 pr-4 text-ink-muted">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4">
                    {team ? (
                      <Link
                        href={`/teams/${team.code.toLowerCase()}`}
                        className="flex items-center gap-2.5 hover:text-(--seq-500)"
                      >
                        <Flag code={team.code} name={team.name} size="sm" />
                        <span>{p.team}</span>
                      </Link>
                    ) : (
                      <span className="text-ink-secondary">{p.team}</span>
                    )}
                  </td>
                  <td className="tabular py-3 pr-4 font-medium">{p.goals}</td>
                  <td
                    className="tabular py-3 pr-4 text-ink-secondary"
                    title={p.tournaments.join(", ")}
                  >
                    {p.tournaments.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!query.trim() && !showAll && filtered.length > DEFAULT_LIMIT && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="glass-chip rounded-full px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary"
          >
            Show all {filtered.length.toLocaleString()} scorers
          </button>
        </div>
      )}
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
