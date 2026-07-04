import { getTeams } from "@/lib/data";
import { getLiveTournament } from "@/lib/fifa";
import { getLiveOdds } from "@/lib/liveOdds";
import RankingsTable, { type RankingRow } from "@/components/RankingsTable";
import PowerScatter from "@/components/PowerScatter";

export const metadata = {
  title: "Rankings — 2026 World Cup Predictor",
};

export default async function RankingsPage() {
  const [teams, live, odds] = await Promise.all([
    getTeams(),
    getLiveTournament(),
    getLiveOdds(),
  ]);

  const rows: RankingRow[] = teams.map((t) => ({
    ...t,
    status: live.status[t.code] ?? { kind: "eliminated", phase: "Group stage" },
    liveChampion: odds.byTeam[t.code]?.champion ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight">Team rankings</h1>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        All 48 teams with their live tournament status. &ldquo;Title odds
        now&rdquo; conditions on every match already played; the pre-tournament
        column is what the same model said before a ball was kicked.
      </p>

      <section className="mt-12">
        <RankingsTable rows={rows} />
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-medium tracking-tight">
          FIFA rank vs. model power rating
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Where the model agrees with — and diverges from — the official FIFA
          rankings, by confederation.
        </p>
        <div className="glass mt-6 rounded-2xl p-4">
          <PowerScatter teams={teams} />
        </div>
      </section>
    </div>
  );
}
