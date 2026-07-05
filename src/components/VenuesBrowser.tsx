"use client";

import { useMemo, useState } from "react";
import Flag from "./Flag";

export interface VenueMatch {
  matchNumber: number;
  phase: string;
  group: string | null;
  date: string;
  status: "played" | "live" | "scheduled";
  homeCode: string | null;
  awayCode: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface VenueGroup {
  venue: string;
  city: string;
  matches: VenueMatch[];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function VenuesBrowser({ venues }: { venues: VenueGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return venues;
    const q = query.trim().toLowerCase();
    return venues.filter(
      (v) =>
        v.venue.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.matches.some(
          (m) =>
            m.homeTeamName?.toLowerCase().includes(q) ||
            m.awayTeamName?.toLowerCase().includes(q),
        ),
    );
  }, [venues, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stadiums, cities, teams..."
          className="glass-chip rounded-full px-4 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <span className="text-sm text-ink-muted">
          {filtered.length} of {venues.length} venues
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((v) => (
          <div key={v.venue} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-medium tracking-tight">{v.venue}</p>
                <p className="text-sm text-ink-secondary">{v.city}</p>
              </div>
              <span className="glass-chip shrink-0 rounded-full px-2.5 py-1 text-xs text-ink-secondary">
                {v.matches.length} match{v.matches.length === 1 ? "" : "es"}
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {v.matches.map((m) => (
                <div key={m.matchNumber} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0 text-xs text-ink-muted">
                    {fmtDate(m.date)}
                  </span>
                  {m.homeCode && m.awayCode ? (
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                      <Flag code={m.homeCode} name={m.homeTeamName ?? m.homeCode} size="sm" />
                      <span className="truncate">{m.homeTeamName ?? m.homeCode}</span>
                      <span className="text-ink-muted">v</span>
                      <span className="truncate">{m.awayTeamName ?? m.awayCode}</span>
                      <Flag code={m.awayCode} name={m.awayTeamName ?? m.awayCode} size="sm" />
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-ink-muted">
                      {m.phase}
                      {m.group ? ` · Group ${m.group}` : ""}
                    </span>
                  )}
                  {m.status === "played" ? (
                    <span className="tabular shrink-0 text-xs text-ink-secondary">
                      {m.homeScore}-{m.awayScore}
                    </span>
                  ) : m.status === "live" ? (
                    <span className="shrink-0 rounded-full bg-(--status-good) px-1.5 py-px text-[10px] font-medium text-white">
                      LIVE
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-ink-muted">Upcoming</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ink-muted">No venues match that search.</p>
        )}
      </div>
    </div>
  );
}
