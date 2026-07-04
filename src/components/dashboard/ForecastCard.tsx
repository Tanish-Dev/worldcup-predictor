"use client";

import { useState } from "react";
import Link from "next/link";
import Flag from "@/components/Flag";
import { BallIcon, ExpandIcon } from "./icons";

export interface ForecastSide {
  code: string;
  name: string;
  /** last couple of results for the match card, e.g. "2-1 vs FRA" */
  results: string[];
  /** full tournament path, newest first */
  path: { phase: string; result: string }[];
  profile: { rank: number; attack: number; defense: number; power: number };
  /** 0-100 */
  championPct: number;
  finalPct: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ForecastMatch {
  phaseLabel: string;
  venue: string | null;
  home: ForecastSide;
  away: ForecastSide;
  scoreLabel: string;
  status:
    | { kind: "live"; minute: string | null }
    | { kind: "ft" }
    | { kind: "kickoff"; label: string };
  /** 0-100 */
  homePct: number;
  drawPct: number;
  awayPct: number;
}

const TABS = ["Timeline", "Lineup", "Statistics", "Insights"] as const;
type Tab = (typeof TABS)[number];

function StatusBadge({ status }: { status: ForecastMatch["status"] }) {
  if (status.kind === "live") {
    return (
      <span className="glass-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        {status.minute ? `${status.minute} Live` : "Live"}
      </span>
    );
  }
  return (
    <span className="glass-chip inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white/70">
      {status.kind === "ft" ? "Full time" : status.label}
    </span>
  );
}

function WinProbability({ match }: { match: ForecastMatch }) {
  return (
    <div>
      <p className="text-center text-xs font-medium tracking-[0.18em] text-white/80 uppercase">
        Win probability
      </p>
      <div className="mt-3 grid grid-cols-3 text-xs">
        <div>
          <p className="truncate text-white/70">{match.home.name}</p>
          <p className="tabular mt-0.5 font-medium text-emerald-400">
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
          <p className="truncate text-white/70">{match.away.name}</p>
          <p className="tabular mt-0.5 font-medium text-red-400">
            {Math.round(match.awayPct)}%
          </p>
        </div>
      </div>
      <div className="mt-2 flex h-1.5 gap-1 overflow-hidden rounded-full">
        <span
          className="rounded-full bg-emerald-500"
          style={{ width: `${match.homePct}%` }}
        />
        {match.drawPct > 0.5 && (
          <span
            className="rounded-full bg-white/25"
            style={{ width: `${match.drawPct}%` }}
          />
        )}
        <span
          className="rounded-full bg-red-500"
          style={{ width: `${match.awayPct}%` }}
        />
      </div>
    </div>
  );
}

function CompareRow({
  label,
  home,
  away,
  homeBetter,
}: {
  label: string;
  home: string;
  away: string;
  homeBetter: boolean;
}) {
  return (
    <div className="grid grid-cols-3 items-center text-sm">
      <span
        className={`tabular ${homeBetter ? "font-medium text-emerald-400" : "text-white/75"}`}
      >
        {home}
      </span>
      <span className="text-center text-xs text-white/50">{label}</span>
      <span
        className={`tabular text-right ${!homeBetter ? "font-medium text-emerald-400" : "text-white/75"}`}
      >
        {away}
      </span>
    </div>
  );
}

function OddsBars({
  label,
  home,
  away,
}: {
  label: string;
  home: ForecastSide;
  away: ForecastSide;
}) {
  const pick = label === "Wins the title" ? "championPct" : "finalPct";
  return (
    <div>
      <p className="text-xs text-white/50">{label}</p>
      <div className="mt-1.5 space-y-1.5">
        {[home, away].map((s) => (
          <div key={s.code} className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-xs text-white/75">
              {s.code}
            </span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-white"
                style={{ width: `${Math.min(100, s[pick])}%` }}
              />
            </span>
            <span className="tabular w-10 shrink-0 text-right text-xs">
              {s[pick] >= 10 ? Math.round(s[pick]) : s[pick].toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPanel({ tab, match }: { tab: Tab; match: ForecastMatch }) {
  const { home, away } = match;

  if (tab === "Timeline") {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {[home, away].map((s, col) => (
          <div key={s.code} className="min-w-0 space-y-1.5">
            {s.path.length === 0 && (
              <p className="text-white/45">No matches played yet</p>
            )}
            {s.path.map((p, i) => (
              <p
                key={i}
                className={`flex items-center gap-1.5 ${col === 1 ? "justify-end text-right" : ""}`}
              >
                <span className="glass-chip shrink-0 rounded px-1 py-0.5 text-[10px] text-white/60">
                  {p.phase}
                </span>
                <span className="tabular truncate text-white/80">
                  {p.result}
                </span>
              </p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (tab === "Lineup") {
    return (
      <div className="space-y-2.5">
        <p className="text-center text-xs font-medium tracking-[0.18em] text-white/80 uppercase">
          Team profile
        </p>
        <CompareRow
          label="FIFA rank"
          home={`#${home.profile.rank}`}
          away={`#${away.profile.rank}`}
          homeBetter={home.profile.rank < away.profile.rank}
        />
        <CompareRow
          label="Attack"
          home={home.profile.attack.toFixed(2)}
          away={away.profile.attack.toFixed(2)}
          homeBetter={home.profile.attack > away.profile.attack}
        />
        <CompareRow
          label="Defense"
          home={home.profile.defense.toFixed(2)}
          away={away.profile.defense.toFixed(2)}
          homeBetter={home.profile.defense > away.profile.defense}
        />
        <CompareRow
          label="Power"
          home={home.profile.power.toFixed(2)}
          away={away.profile.power.toFixed(2)}
          homeBetter={home.profile.power > away.profile.power}
        />
      </div>
    );
  }

  if (tab === "Insights") {
    return (
      <div className="space-y-3">
        <OddsBars label="Wins the title" home={home} away={away} />
        <OddsBars label="Reaches the final" home={home} away={away} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WinProbability match={match} />
      <div className="space-y-2 border-t border-white/10 pt-3">
        <CompareRow
          label="Goals scored"
          home={String(home.goalsFor)}
          away={String(away.goalsFor)}
          homeBetter={home.goalsFor >= away.goalsFor}
        />
        <CompareRow
          label="Conceded"
          home={String(home.goalsAgainst)}
          away={String(away.goalsAgainst)}
          homeBetter={home.goalsAgainst <= away.goalsAgainst}
        />
      </div>
    </div>
  );
}

export default function ForecastCard({ match }: { match: ForecastMatch }) {
  const [tab, setTab] = useState<Tab>("Statistics");

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        backdropFilter: "blur(32px)",
        padding: "17px",
        borderRadius: "24px",
        background: "#ffffff0e",

        border: "1px solid #ffffff17",
      }}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-medium">AI Qualification Forecast</h2>
        <Link
          href="/bracket"
          title="Open the full bracket"
          transitionTypes={["nav-forward"]}
          className="text-white/70 hover:text-white"
        >
          <ExpandIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* featured match */}
      <div className="glass rounded-3xl p-5">
        <p className="text-center text-base font-medium">{match.phaseLabel}</p>
        {match.venue && (
          <p className="mt-0.5 text-center text-xs font-light text-white/55">
            {match.venue}
          </p>
        )}

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <Flag code={match.home.code} name={match.home.name} size="lg" />
            <p className="max-w-full truncate text-sm">{match.home.name}</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2">
            <p className="tabular text-3xl font-semibold tracking-tight">
              {match.scoreLabel}
            </p>
            <StatusBadge status={match.status} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Flag code={match.away.code} name={match.away.name} size="lg" />
            <p className="max-w-full truncate text-sm">{match.away.name}</p>
          </div>
        </div>

        {(match.home.results.length > 0 || match.away.results.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-xs text-white/65">
            <div className="space-y-1.5">
              {match.home.results.map((r) => (
                <p key={r} className="flex items-center gap-1.5">
                  <BallIcon className="h-3.5 w-3.5 shrink-0 text-white/45" />
                  <span className="tabular truncate">{r}</span>
                </p>
              ))}
            </div>
            <div className="space-y-1.5">
              {match.away.results.map((r) => (
                <p
                  key={r}
                  className="flex items-center justify-end gap-1.5 text-right"
                >
                  <BallIcon className="h-3.5 w-3.5 shrink-0 text-white/45" />
                  <span className="tabular truncate">{r}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* tabs */}
      <div className="glass flex rounded-full p-1 text-sm" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tab ? "true" : "false"}
            onClick={() => setTab(t)}
            className={`flex-1 cursor-pointer rounded-full px-2 py-1.5 text-center transition ${
              t === tab
                ? "bg-white/15 font-medium text-white"
                : "text-white/45 hover:text-white/75"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="glass min-h-[132px] rounded-2xl p-4">
        <TabPanel tab={tab} match={match} />
      </div>

      <Link
        href="/bracket"
        transitionTypes={["nav-forward"]}
        className="rounded-2xl bg-white py-3 text-center text-sm font-medium text-[#0a1526] transition hover:bg-white/90"
      >
        Watch Now
      </Link>
    </div>
  );
}
