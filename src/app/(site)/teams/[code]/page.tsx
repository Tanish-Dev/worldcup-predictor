import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayers, getTeamByCode, getTeamMatches, getTeams } from "@/lib/data";
import { getLiveTournament } from "@/lib/fifa";
import { getLiveOdds } from "@/lib/liveOdds";
import type { TeamPredictions } from "@/lib/types";
import Flag from "@/components/Flag";
import StatusPill from "@/components/StatusPill";
import ProbabilityBar from "@/components/ProbabilityBar";

export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((t) => ({ code: t.code.toLowerCase() }));
}

const PRE_STAGES: { key: keyof TeamPredictions; label: string }[] = [
  { key: "groupWinner", label: "Win group" },
  { key: "roundOf32", label: "Reach round of 32" },
  { key: "roundOf16", label: "Reach round of 16" },
  { key: "quarterfinal", label: "Reach quarterfinal" },
  { key: "semifinal", label: "Reach semifinal" },
  { key: "final", label: "Reach final" },
  { key: "champion", label: "Win the tournament" },
];

const LIVE_STAGES = [
  { key: "quarterfinal", label: "Reach quarterfinal" },
  { key: "semifinal", label: "Reach semifinal" },
  { key: "final", label: "Reach final" },
  { key: "champion", label: "Win the tournament" },
] as const;

export default async function TeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const team = await getTeamByCode(code);
  if (!team) notFound();

  const [matches, live, odds, teams, players] = await Promise.all([
    getTeamMatches(team.name),
    getLiveTournament(),
    getLiveOdds(),
    getTeams(),
    getPlayers(),
  ]);

  const topScorers = players
    .filter((p) => p.team.toLowerCase() === team.name.toLowerCase())
    .slice(0, 5);

  const names = Object.fromEntries(teams.map((t) => [t.code, t.name]));
  const status = live.status[team.code];
  const liveOdds = odds.byTeam[team.code];
  const campaign = live.matches.filter(
    (m) => m.homeCode === team.code || m.awayCode === team.code,
  );
  // teams.json's group letters are model-assigned and don't match FIFA's real draw
  const liveGroup = campaign.find((m) => m.phase === "Group stage")?.group ?? team.group;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      <Link href="/rankings" className="text-sm text-ink-secondary hover:text-ink-primary">
        &larr; All teams
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <Flag code={team.code} name={team.name} size="xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-medium tracking-tight">{team.name}</h1>
            {status && <StatusPill status={status} />}
          </div>
          <p className="mt-1.5 text-ink-secondary">
            {team.confederation} &middot; FIFA rank #{team.fifaRank} &middot; Group{" "}
            {liveGroup}
            {team.isHost && " · 2026 host"}
            {team.isDebutant && " · World Cup debut"}
            {team.titles > 0 && ` · ${team.titles}x champion`}
          </p>
        </div>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-ink-secondary">Power rating</p>
          <p className="mt-2 text-2xl font-medium">{team.powerRating.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-ink-secondary">Attack / Defense</p>
          <p className="mt-2 text-2xl font-medium">
            {team.attackRating.toFixed(2)} / {team.defenseRating.toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-ink-secondary">World Cups played</p>
          <p className="mt-2 text-2xl font-medium">{team.worldCupsPlayed}</p>
        </div>
      </section>

      {liveOdds && (
        <section className="mt-14">
          <h2 className="text-xl font-medium tracking-tight">Odds from here</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Conditioned on every 2026 match already played, from{" "}
            {odds.simulations.toLocaleString()} simulated completions of the bracket.
          </p>
          <div className="glass mt-6 space-y-4 rounded-3xl p-5 sm:p-6">
            {LIVE_STAGES.map((stage) => (
              <ProbabilityBar
                key={stage.key}
                label={stage.label}
                value={liveOdds[stage.key]}
                labelClassName="w-44 shrink-0 text-sm text-ink-primary"
              />
            ))}
          </div>
        </section>
      )}

      {campaign.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-medium tracking-tight">2026 campaign</h2>
          <div className="mt-6 space-y-2">
            {campaign.map((m) => {
              const isHome = m.homeCode === team.code;
              const oppCode = isHome ? m.awayCode : m.homeCode;
              const teamScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const played = m.status === "played";
              const won = played && m.winnerCode === team.code;
              const drew = played && !m.winnerCode;
              return (
                <div
                  key={m.matchNumber}
                  className="glass-chip flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="w-32 shrink-0 text-ink-secondary">
                    {m.phase === "Group stage" ? `Group ${m.group}` : m.phase}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {oppCode && (
                      <>
                        <Flag code={oppCode} name={names[oppCode] ?? oppCode} size="sm" />
                        <span className="truncate">vs {names[oppCode] ?? oppCode}</span>
                      </>
                    )}
                  </span>
                  {played ? (
                    <span className="flex items-center gap-3">
                      <span className="tabular font-medium">
                        {teamScore}–{oppScore}
                      </span>
                      <span
                        className={
                          won
                            ? "w-5 text-center text-xs font-medium text-(--status-good)"
                            : drew
                              ? "w-5 text-center text-xs font-medium text-ink-muted"
                              : "w-5 text-center text-xs font-medium text-(--status-critical)"
                        }
                      >
                        {won ? "W" : drew ? "D" : "L"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">
                      {m.status === "live" ? "Live now" : "Upcoming"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-medium tracking-tight">Pre-tournament odds</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          What the model expected before the tournament started.
        </p>
        <div className="glass mt-6 space-y-4 rounded-3xl p-5 sm:p-6">
          {PRE_STAGES.map((stage) => (
            <ProbabilityBar
              key={stage.key}
              label={stage.label}
              value={team.predictions[stage.key]}
              labelClassName="w-44 shrink-0 text-sm text-ink-primary"
              muted
            />
          ))}
        </div>
      </section>

      {topScorers.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-medium tracking-tight">Top scorers</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            {team.name}&apos;s all-time leading World Cup goal-scorers, 1930-2022.
          </p>
          <div className="mt-6 space-y-2">
            {topScorers.map((p) => (
              <div
                key={p.name}
                className="glass-chip flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="flex items-center gap-4 text-ink-secondary">
                  <span title={p.tournaments.join(", ")}>
                    {p.tournaments.length} World Cup{p.tournaments.length > 1 ? "s" : ""}
                  </span>
                  <span className="tabular font-medium text-ink-primary">
                    {p.goals} goal{p.goals > 1 ? "s" : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {matches.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-medium tracking-tight">World Cup history</h2>
          <div className="mt-6 space-y-2">
            {matches.map((m, i) => {
              const isHome = m.homeTeam === team.name;
              const opponent = isHome ? m.awayTeam : m.homeTeam;
              const teamScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const result =
                teamScore === null || oppScore === null
                  ? ""
                  : teamScore > oppScore
                    ? "W"
                    : teamScore < oppScore
                      ? "L"
                      : "D";
              return (
                <div
                  key={i}
                  className="glass-chip flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="tabular w-12 text-ink-muted">{m.year}</span>
                    <span className="text-ink-secondary">{m.round}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>vs {opponent}</span>
                    <span className="tabular font-medium">
                      {teamScore}–{oppScore}
                    </span>
                    {result && (
                      <span
                        className={
                          result === "W"
                            ? "w-5 text-center text-xs font-medium text-(--status-good)"
                            : result === "L"
                              ? "w-5 text-center text-xs font-medium text-(--status-critical)"
                              : "w-5 text-center text-xs font-medium text-ink-muted"
                        }
                      >
                        {result}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
