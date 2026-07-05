import { getTeams } from "@/lib/data";
import { getLiveTournament } from "@/lib/fifa";
import { getLiveOdds } from "@/lib/liveOdds";
import { getMatchEvents } from "@/lib/matchEvents";
import type { LiveMatch } from "@/lib/types";
import MatchesBrowser, { type MatchRow } from "@/components/MatchesBrowser";

export const metadata = {
  title: "Matches — 2026 World Cup Predictor",
};

const HIGHLIGHT_KINDS = new Set(["goal", "ownGoal", "penaltyGoal", "redCard"]);

export default async function MatchesPage() {
  const [teams, live, odds] = await Promise.all([
    getTeams(),
    getLiveTournament(),
    getLiveOdds(),
  ]);

  const byCode = Object.fromEntries(teams.map((t) => [t.code, t]));
  const power = (code: string | null) => (code && byCode[code]?.powerRating) || 0;

  const matchPcts = (m: LiveMatch) => {
    if (m.status === "played") {
      const homeWon = m.winnerCode === m.homeCode;
      return { homePct: homeWon ? 100 : 0, drawPct: 0, awayPct: homeWon ? 0 : 100 };
    }
    const p =
      odds.matchHomeWinProb[m.matchNumber] ??
      1 / (1 + Math.exp(-(power(m.homeCode) - power(m.awayCode))));
    const drawPct = m.phase === "Group stage" ? 24 : 0;
    return {
      homePct: (100 - drawPct) * p,
      drawPct,
      awayPct: (100 - drawPct) * (1 - p),
    };
  };

  const rows: MatchRow[] = await Promise.all(
    live.matches.map(async (m) => {
      const events =
        m.status === "scheduled" ? [] : await getMatchEvents(m.idStage, m.idMatch);
      return {
        ...m,
        homeTeamName: (m.homeCode && byCode[m.homeCode]?.name) || m.homeName,
        awayTeamName: (m.awayCode && byCode[m.awayCode]?.name) || m.awayName,
        ...matchPcts(m),
        highlights: events.filter((e) => HIGHLIGHT_KINDS.has(e.kind)),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium tracking-tight">Matches</h1>
        <p className="text-sm text-ink-muted">
          Results from FIFA &middot; refreshed every 5 minutes
        </p>
      </div>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        Every fixture in the 2026 tournament, group stage through the final.
        Played matches show the real score and goal-by-goal highlights; the
        rest show each side&apos;s simulated chance of going through.
      </p>

      <section className="mt-10">
        <MatchesBrowser matches={rows} />
      </section>
    </div>
  );
}
