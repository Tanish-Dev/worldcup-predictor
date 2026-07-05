"use client";

import { useState } from "react";
import Flag from "@/components/Flag";
import {
  playOutBracket,
  type BracketMatch,
  type PlayedOutMatch,
  type TeamRating,
} from "@/lib/bracket";

export default function PlayOutSimulator({
  bracket,
  ratings,
  names,
  homeAdvantage,
}: {
  bracket: BracketMatch[];
  ratings: Record<string, TeamRating>;
  names: Record<string, string>;
  homeAdvantage: number;
}) {
  const [outcome, setOutcome] = useState<{
    results: PlayedOutMatch[];
    champion: string;
  } | null>(null);
  const [runs, setRuns] = useState(0);

  if (bracket.length === 0) return null;

  function run() {
    setOutcome(playOutBracket(bracket, ratings, homeAdvantage));
    setRuns((r) => r + 1);
  }

  const phases = outcome
    ? [...new Set(outcome.results.map((r) => r.phase))]
    : [];

  return (
    <div className="glass rounded-3xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-medium tracking-tight">Play out one ending</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            One random completion of the remaining matches, weighted by each
            team&apos;s rating — reload the dice as often as you like.
          </p>
        </div>
        <button
          onClick={run}
          className="w-full shrink-0 rounded-full bg-white px-5 py-2.5 text-center text-sm font-medium text-[#0a1526] transition hover:bg-white/90 sm:w-auto"
        >
          {outcome ? `Roll again (#${runs + 1})` : "Roll the bracket"}
        </button>
      </div>

      {outcome && (
        <div className="mt-8">
          <div className="glass-deep flex items-center gap-4 rounded-2xl p-4 sm:p-5">
            <Flag code={outcome.champion} name={names[outcome.champion]} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-ink-secondary">This run&apos;s champion</p>
              <p className="truncate text-2xl font-medium tracking-tight">
                {names[outcome.champion] ?? outcome.champion}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase) => (
              <div key={phase}>
                <p className="text-sm font-medium text-ink-secondary">{phase}</p>
                <div className="mt-3 space-y-2">
                  {outcome.results
                    .filter((r) => r.phase === phase)
                    .map((r) => (
                      <div
                        key={r.matchNumber}
                        className="glass-chip rounded-xl p-3 text-sm"
                      >
                        <SimRow
                          code={r.homeCode}
                          name={names[r.homeCode]}
                          goals={r.goalsHome}
                          won={r.winnerCode === r.homeCode}
                        />
                        <SimRow
                          code={r.awayCode}
                          name={names[r.awayCode]}
                          goals={r.goalsAway}
                          won={r.winnerCode === r.awayCode}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimRow({
  code,
  name,
  goals,
  won,
}: {
  code: string;
  name: string;
  goals: number;
  won: boolean;
}) {
  return (
    <p className={`flex items-center gap-2 py-0.5 ${won ? "font-medium" : "text-ink-muted"}`}>
      <Flag code={code} name={name ?? code} size="sm" />
      <span className="min-w-0 flex-1 truncate">{name ?? code}</span>
      <span className="tabular">{goals}</span>
    </p>
  );
}
