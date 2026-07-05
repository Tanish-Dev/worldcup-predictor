import { getPlayers, getTeams } from "@/lib/data";
import { getLivePlayerStats } from "@/lib/livePlayers";
import PlayersTable from "@/components/PlayersTable";
import LivePlayerStatsTable, {
  type LivePlayerRow,
} from "@/components/LivePlayerStatsTable";

export const metadata = {
  title: "Player stats — 2026 World Cup Predictor",
};

export default async function PlayersPage() {
  const [players, teams, liveStats] = await Promise.all([
    getPlayers(),
    getTeams(),
    getLivePlayerStats(),
  ]);

  const byCode = Object.fromEntries(teams.map((t) => [t.code, t]));
  const liveRows: LivePlayerRow[] = liveStats.map((s) => ({
    ...s,
    teamName: byCode[s.teamCode]?.name ?? s.teamCode,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-3xl font-medium tracking-tight">Player stats</h1>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        Goals, assists and cards from every match played so far at the 2026
        World Cup, pulled straight from FIFA&apos;s live match feed and
        refreshed every 5 minutes.
      </p>

      <section className="mt-12">
        <LivePlayerStatsTable rows={liveRows} />
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight">
          All-time top scorers
        </h2>
        <p className="mt-3 max-w-2xl text-ink-secondary">
          Every World Cup goal-scorer from 1930 to 2022, aggregated from match
          records. Own goals and penalty-shootout goals aren&apos;t counted,
          matching the usual top-scorer convention.
        </p>
        <div className="mt-6">
          <PlayersTable players={players} teams={teams} />
        </div>
      </section>
    </div>
  );
}
