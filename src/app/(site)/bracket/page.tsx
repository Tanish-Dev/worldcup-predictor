import { getMeta, getTeams } from "@/lib/data";
import { getLiveTournament } from "@/lib/fifa";
import { getLiveOdds } from "@/lib/liveOdds";
import { remainingBracket, type TeamRating } from "@/lib/bracket";
import type { LiveMatch, MatchPhase } from "@/lib/types";
import Flag from "@/components/Flag";
import PlayOutSimulator from "@/components/PlayOutSimulator";

export const metadata = {
  title: "Live bracket — 2026 World Cup Predictor",
};

const KNOCKOUT_PHASES: MatchPhase[] = [
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Final",
];

function kickoff(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

export default async function BracketPage() {
  const [teams, meta, live, odds] = await Promise.all([
    getTeams(),
    getMeta(),
    getLiveTournament(),
    getLiveOdds(),
  ]);

  const names: Record<string, string> = {};
  const ratings: Record<string, TeamRating> = {};
  for (const t of teams) {
    names[t.code] = t.name;
    ratings[t.code] = { code: t.code, attack: t.attackRating, defense: t.defenseRating };
  }

  const bracket = remainingBracket(live.matches);
  const thirdPlace = live.matches.find((m) => m.phase === "Third place");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium tracking-tight">Live bracket</h1>
        <p className="text-sm text-ink-muted">
          Results from FIFA &middot; refreshed every 5 minutes
        </p>
      </div>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        Played matches show the real score. Upcoming matches show each side&apos;s
        simulated chance of going through, from {odds.simulations.toLocaleString()}{" "}
        completions of the remaining bracket.
      </p>

      <div className="mt-10 flex gap-6 overflow-x-auto pb-4">
        {KNOCKOUT_PHASES.map((phase) => {
          const phaseMatches = live.matches.filter((m) => m.phase === phase);
          if (phaseMatches.length === 0) return null;
          return (
            <div
              key={phase}
              className="flex w-60 shrink-0 flex-col justify-around gap-3"
            >
              <p className="text-sm font-medium text-ink-secondary">{phase}</p>
              {phaseMatches.map((m) => (
                <MatchCard
                  key={m.matchNumber}
                  match={m}
                  names={names}
                  homeWinProb={odds.matchHomeWinProb[m.matchNumber]}
                />
              ))}
            </div>
          );
        })}
      </div>

      {thirdPlace && thirdPlace.status === "played" && (
        <p className="mt-2 text-sm text-ink-muted">
          Third place: {names[thirdPlace.winnerCode ?? ""] ?? thirdPlace.winnerCode}
        </p>
      )}

      <section className="mt-14">
        <PlayOutSimulator
          bracket={bracket}
          ratings={ratings}
          names={names}
          homeAdvantage={meta.homeAdvantage}
        />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight">Group stage results</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Final tables from the real group stage. Teams in bold advanced to the
          round of 32.
        </p>
        <GroupTables live={live} names={names} />
      </section>
    </div>
  );
}

function MatchCard({
  match,
  names,
  homeWinProb,
}: {
  match: LiveMatch;
  names: Record<string, string>;
  homeWinProb?: number;
}) {
  const played = match.status === "played";
  const isLive = match.status === "live";

  return (
    <div
      className={`glass rounded-xl p-3 text-sm ${
        isLive ? "ring-1 ring-(--status-good)" : ""
      }`}
    >
      <TeamRow
        code={match.homeCode}
        placeholder={match.homePlaceholder}
        names={names}
        score={match.homeScore}
        penalties={match.homePenalties}
        winProb={homeWinProb}
        won={played && match.winnerCode === match.homeCode}
        played={played}
      />
      <TeamRow
        code={match.awayCode}
        placeholder={match.awayPlaceholder}
        names={names}
        score={match.awayScore}
        penalties={match.awayPenalties}
        winProb={homeWinProb === undefined ? undefined : 1 - homeWinProb}
        won={played && match.winnerCode === match.awayCode}
        played={played}
      />
      {!played && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          {isLive && (
            <span className="rounded-full bg-(--status-good) px-1.5 py-px text-[10px] font-medium text-white">
              LIVE
            </span>
          )}
          {kickoff(match.date)}
        </p>
      )}
    </div>
  );
}

function TeamRow({
  code,
  placeholder,
  names,
  score,
  penalties,
  winProb,
  won,
  played,
}: {
  code: string | null;
  placeholder: string | null;
  names: Record<string, string>;
  score: number | null;
  penalties: number | null;
  winProb?: number;
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
      <Flag code={code} name={names[code] ?? code} size="sm" />
      <span className="min-w-0 flex-1 truncate">{names[code] ?? code}</span>
      {played ? (
        <span className="tabular">
          {score}
          {penalties !== null && (
            <span className="ml-1 text-xs text-ink-muted">({penalties})</span>
          )}
        </span>
      ) : winProb !== undefined ? (
        <span className="tabular text-xs text-ink-secondary">
          {(winProb * 100).toFixed(0)}%
        </span>
      ) : null}
    </p>
  );
}

function GroupTables({
  live,
  names,
}: {
  live: Awaited<ReturnType<typeof getLiveTournament>>;
  names: Record<string, string>;
}) {
  const groups = new Map<
    string,
    Map<string, { points: number; gd: number; gf: number }>
  >();
  for (const m of live.matches) {
    if (m.phase !== "Group stage" || m.status !== "played") continue;
    if (!m.group || !m.homeCode || !m.awayCode) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const table = groups.get(m.group) ?? new Map();
    groups.set(m.group, table);
    for (const code of [m.homeCode, m.awayCode]) {
      if (!table.has(code)) table.set(code, { points: 0, gd: 0, gf: 0 });
    }
    const home = table.get(m.homeCode)!;
    const away = table.get(m.awayCode)!;
    home.gf += m.homeScore;
    away.gf += m.awayScore;
    home.gd += m.homeScore - m.awayScore;
    away.gd += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) home.points += 3;
    else if (m.awayScore > m.homeScore) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  const advanced = new Set<string>();
  for (const m of live.matches) {
    if (m.phase === "Round of 32") {
      if (m.homeCode) advanced.add(m.homeCode);
      if (m.awayCode) advanced.add(m.awayCode);
    }
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([groupName, table]) => (
          <div key={groupName} className="glass rounded-2xl p-4">
            <p className="text-sm font-medium text-ink-secondary">Group {groupName}</p>
            <table className="tabular mt-3 w-full text-sm">
              <tbody>
                {[...table.entries()]
                  .sort(
                    ([, a], [, b]) => b.points - a.points || b.gd - a.gd || b.gf - a.gf,
                  )
                  .map(([code, row]) => (
                    <tr
                      key={code}
                      className={advanced.has(code) ? "font-medium" : "text-ink-muted"}
                    >
                      <td className="py-1 pr-2">
                        <span className="flex items-center gap-2">
                          <Flag code={code} name={names[code] ?? code} size="sm" />
                          <span className="truncate">{names[code] ?? code}</span>
                        </span>
                      </td>
                      <td className="w-8 py-1 text-right">{row.points}</td>
                      <td className="w-10 py-1 text-right text-xs">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
