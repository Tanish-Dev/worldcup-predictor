import { cache } from "react";
import { getLiveTournament } from "./fifa";
import { getMeta, getTeams } from "./data";
import {
  applyLiveForm,
  playOutBracket,
  remainingBracket,
  type TeamRating,
} from "./bracket";
import type { LiveOdds, MatchPhase } from "./types";

const SIMULATIONS = 20000;

const APPEARANCE_PHASES: { phase: MatchPhase; key: keyof LiveOdds["byTeam"][string] }[] = [
  { phase: "Quarterfinal", key: "quarterfinal" },
  { phase: "Semifinal", key: "semifinal" },
  { phase: "Final", key: "final" },
];

/**
 * Champion odds conditioned on the tournament as it stands: only the
 * matches FIFA still lists as unplayed are simulated; everything already
 * decided on the pitch is taken as fact.
 */
export const getLiveOdds = cache(async (): Promise<LiveOdds> => {
  const [tournament, teams, meta] = await Promise.all([
    getLiveTournament(),
    getTeams(),
    getMeta(),
  ]);

  const preTournamentRatings: Record<string, TeamRating> = {};
  for (const t of teams) {
    preTournamentRatings[t.code] = { code: t.code, attack: t.attackRating, defense: t.defenseRating };
  }
  // Current-tournament form: teams overperforming or underperforming their
  // pre-tournament rating on the pitch right now carry that into the rest
  // of the simulation, instead of being judged solely on history/FIFA points.
  const ratings = applyLiveForm(
    preTournamentRatings,
    tournament.matches.filter((m) => m.status === "played"),
    meta.homeAdvantage,
  );

  const bracket = remainingBracket(tournament.matches);

  const championCounts: Record<string, number> = {};
  const appearanceCounts: Record<string, Record<string, number>> = {};
  const homeWinCounts: Record<number, number> = {};

  for (let i = 0; i < SIMULATIONS; i++) {
    const { results, champion } = playOutBracket(bracket, ratings, meta.homeAdvantage);
    championCounts[champion] = (championCounts[champion] ?? 0) + 1;
    for (const r of results) {
      if (r.winnerCode === r.homeCode) {
        homeWinCounts[r.matchNumber] = (homeWinCounts[r.matchNumber] ?? 0) + 1;
      }
      for (const { phase, key } of APPEARANCE_PHASES) {
        if (r.phase === phase) {
          for (const code of [r.homeCode, r.awayCode]) {
            appearanceCounts[code] ??= {};
            appearanceCounts[code][key] = (appearanceCounts[code][key] ?? 0) + 1;
          }
        }
      }
    }
  }

  const PHASE_ORDER: MatchPhase[] = [
    "Group stage",
    "Round of 32",
    "Round of 16",
    "Quarterfinal",
    "Semifinal",
    "Third place",
    "Final",
  ];

  const byTeam: LiveOdds["byTeam"] = {};
  for (const code of tournament.alive) {
    const appear = appearanceCounts[code] ?? {};
    const status = tournament.status[code];
    // a stage the team has already reached on the pitch is certain, not simulated
    const reachedIdx =
      status.kind === "alive" ? PHASE_ORDER.indexOf(status.phase) : PHASE_ORDER.length;
    const prob = (phase: MatchPhase, key: string) =>
      PHASE_ORDER.indexOf(phase) <= reachedIdx
        ? 1
        : ((appear[key] ?? 0) / SIMULATIONS);
    byTeam[code] = {
      quarterfinal: prob("Quarterfinal", "quarterfinal"),
      semifinal: prob("Semifinal", "semifinal"),
      final: prob("Final", "final"),
      champion: (championCounts[code] ?? 0) / SIMULATIONS,
    };
  }

  const matchHomeWinProb: Record<number, number> = {};
  for (const m of bracket) {
    // only meaningful when both participants are already known
    if ("code" in m.home && "code" in m.away) {
      matchHomeWinProb[m.matchNumber] = (homeWinCounts[m.matchNumber] ?? 0) / SIMULATIONS;
    }
  }

  return { simulations: SIMULATIONS, byTeam, matchHomeWinProb };
});
