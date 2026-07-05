"use client";

import { useMemo, useState } from "react";
import Flag from "./Flag";
import type { LiveMatch, MatchPhase } from "@/lib/types";
import type { MatchEvent } from "@/lib/matchEvents";

export interface MatchRow extends LiveMatch {
  homeTeamName: string | null;
  awayTeamName: string | null;
  homePct: number;
  drawPct: number;
  awayPct: number;
  highlights: MatchEvent[];
}

const HIGHLIGHT_STYLE: Record<string, string> = {
  goal: "text-ink-primary",
  penaltyGoal: "text-ink-primary",
  ownGoal: "text-ink-muted",
  redCard: "text-(--status-critical)",
};

type StatusFilter = "all" | "live" | "scheduled" | "played";

const PHASE_ORDER: MatchPhase[] = [
  "Group stage",
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Third place",
  "Final",
];

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function kickoff(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

export default function MatchesBrowser({ matches }: { matches: MatchRow[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stage, setStage] = useState<MatchPhase | "all">("all");
  const [query, setQuery] = useState("");

  const stagesPresent = useMemo(
    () => PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p)),
    [matches],
  );

  const filtered = useMemo(() => {
    let out = matches;
    if (status !== "all") out = out.filter((m) => m.status === status);
    if (stage !== "all") out = out.filter((m) => m.phase === stage);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (m) =>
          m.homeTeamName?.toLowerCase().includes(q) ||
          m.awayTeamName?.toLowerCase().includes(q) ||
          m.homeCode?.toLowerCase().includes(q) ||
          m.awayCode?.toLowerCase().includes(q) ||
          m.venue?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          (m.group && `group ${m.group}`.includes(q)),
      );
    }
    return [...out].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [matches, status, stage, query]);

  const byDay = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of filtered) {
      const key = dayKey(m.date);
      (map.get(key) ?? map.set(key, []).get(key)!).push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      <div className="glass flex flex-wrap items-center gap-3 rounded-3xl p-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, venue, group..."
          className="glass-chip rounded-full px-4 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["live", "Live"],
              ["scheduled", "Upcoming"],
              ["played", "Played"],
            ] as [StatusFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={
                status === key
                  ? "rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium"
                  : "rounded-full px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStage("all")}
            className={
              stage === "all"
                ? "shrink-0 rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium"
                : "shrink-0 rounded-full px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary"
            }
          >
            All stages
          </button>
          {stagesPresent.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setStage(p)}
              className={
                stage === p
                  ? "shrink-0 rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium"
                  : "shrink-0 rounded-full px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary"
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {byDay.length === 0 && (
          <p className="text-sm text-ink-muted">No matches match those filters.</p>
        )}
        {byDay.map(([key, dayMatches]) => (
          <div key={key}>
            <p className="text-sm font-medium text-ink-secondary">
              {dayLabel(dayMatches[0].date)}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dayMatches.map((m) => (
                <MatchRowCard key={m.matchNumber} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchRowCard({ match: m }: { match: MatchRow }) {
  const played = m.status === "played";
  const isLive = m.status === "live";

  return (
    <div
      className={`glass rounded-2xl p-4 text-sm ${
        isLive ? "ring-1 ring-(--status-good)" : ""
      }`}
    >
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          {m.phase}
          {m.group ? ` · Group ${m.group}` : ""}
        </span>
        {isLive ? (
          <span className="rounded-full bg-(--status-good) px-1.5 py-px text-[10px] font-medium text-white">
            LIVE {m.matchTime ?? ""}
          </span>
        ) : (
          <span>{played ? "FT" : kickoff(m.date)}</span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <TeamLine
          code={m.homeCode}
          name={m.homeTeamName}
          placeholder={m.homePlaceholder}
          score={m.homeScore}
          penalties={m.homePenalties}
          pct={m.homePct}
          won={played && m.winnerCode === m.homeCode}
          played={played}
        />
        <TeamLine
          code={m.awayCode}
          name={m.awayTeamName}
          placeholder={m.awayPlaceholder}
          score={m.awayScore}
          penalties={m.awayPenalties}
          pct={m.awayPct}
          won={played && m.winnerCode === m.awayCode}
          played={played}
        />
      </div>

      {m.highlights.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
          {m.highlights.map((e, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="tabular shrink-0 text-ink-muted">{e.minute}</span>
              <span className={HIGHLIGHT_STYLE[e.kind] ?? "text-ink-secondary"}>
                {e.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(m.venue || m.city) && (
        <p className="mt-3 truncate text-xs text-ink-muted">
          {m.venue}
          {m.venue && m.city ? " · " : ""}
          {m.city}
        </p>
      )}
    </div>
  );
}

function TeamLine({
  code,
  name,
  placeholder,
  score,
  penalties,
  pct,
  won,
  played,
}: {
  code: string | null;
  name: string | null;
  placeholder: string | null;
  score: number | null;
  penalties: number | null;
  pct: number;
  won: boolean;
  played: boolean;
}) {
  if (!code) {
    return (
      <p className="flex items-center gap-2 py-0.5 text-ink-muted">
        <span className="inline-block h-5 w-5 rounded-full border border-dashed border-axis" />
        <span className="text-xs">
          Winner of M{placeholder?.replace(/^W/, "") ?? "?"}
        </span>
      </p>
    );
  }
  return (
    <p
      className={`flex items-center gap-2 py-0.5 ${
        played && !won ? "text-ink-muted" : won ? "font-medium" : ""
      }`}
    >
      <Flag code={code} name={name ?? code} size="sm" />
      <span className="min-w-0 flex-1 truncate">{name ?? code}</span>
      {played ? (
        <span className="tabular">
          {score}
          {penalties !== null && (
            <span className="ml-1 text-xs text-ink-muted">({penalties})</span>
          )}
        </span>
      ) : (
        <span className="tabular text-xs text-ink-secondary">{pct.toFixed(0)}%</span>
      )}
    </p>
  );
}
