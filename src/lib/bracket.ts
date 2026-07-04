import type { LiveMatch, MatchPhase } from "./types";

export const HOST_CODES = new Set(["USA", "MEX", "CAN"]);

export interface TeamRating {
  code: string;
  attack: number;
  defense: number;
}

/** A knockout slot: either a known team or the winner of an earlier match. */
export type Slot = { code: string } | { winnerOf: number };

export interface BracketMatch {
  matchNumber: number;
  phase: MatchPhase;
  date: string;
  home: Slot;
  away: Slot;
}

export function samplePoisson(lambda: number, random: () => number): number {
  const threshold = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= random();
  } while (p > threshold);
  return k - 1;
}

export interface SimulatedResult {
  goalsHome: number;
  goalsAway: number;
  winnerCode: string;
}

export function simulateKnockoutMatch(
  home: TeamRating,
  away: TeamRating,
  homeAdvantage: number,
  random: () => number,
): SimulatedResult {
  const hostBoost = HOST_CODES.has(home.code) ? homeAdvantage : 0;
  const awayBoost = HOST_CODES.has(away.code) ? homeAdvantage : 0;
  const lambdaHome = Math.exp(home.attack - away.defense + hostBoost);
  const lambdaAway = Math.exp(away.attack - home.defense + awayBoost);
  let goalsHome = samplePoisson(lambdaHome, random);
  let goalsAway = samplePoisson(lambdaAway, random);

  if (goalsHome === goalsAway) {
    const strengthHome = home.attack + home.defense;
    const strengthAway = away.attack + away.defense;
    const pHomeWinsShootout = 1 / (1 + Math.exp(-(strengthHome - strengthAway)));
    if (random() < pHomeWinsShootout) goalsHome += 1;
    else goalsAway += 1;
  }

  return {
    goalsHome,
    goalsAway,
    winnerCode: goalsHome > goalsAway ? home.code : away.code,
  };
}

function parseSlot(
  code: string | null,
  placeholder: string | null,
): Slot | null {
  if (code) return { code };
  const ref = placeholder?.match(/^W(\d+)$/);
  if (ref) return { winnerOf: Number(ref[1]) };
  return null; // e.g. "RU101" (third-place playoff) — not on the title path
}

/**
 * The remaining title path: every unplayed knockout match except the
 * third-place playoff, with unresolved slots pointing at feeder matches.
 */
export function remainingBracket(matches: LiveMatch[]): BracketMatch[] {
  const bracket: BracketMatch[] = [];
  for (const m of matches) {
    if (m.status === "played") continue;
    if (m.phase === "Group stage" || m.phase === "Third place") continue;
    const home = parseSlot(m.homeCode, m.homePlaceholder);
    const away = parseSlot(m.awayCode, m.awayPlaceholder);
    if (!home || !away) continue;
    bracket.push({ matchNumber: m.matchNumber, phase: m.phase, date: m.date, home, away });
  }
  return bracket.sort((a, b) => a.matchNumber - b.matchNumber);
}

/**
 * Nudge pre-tournament attack/defense ratings using goals actually scored
 * and conceded so far in the live 2026 tournament, so a team that is
 * over- or under-performing its historical rating on the pitch right now
 * carries that form into simulations of its remaining matches. The shift is
 * shrunk towards zero for small sample sizes (a couple of group games)
 * and capped so a handful of matches can't overwhelm years of history.
 */
export function applyLiveForm(
  ratings: Record<string, TeamRating>,
  playedMatches: LiveMatch[],
  homeAdvantage: number,
): Record<string, TeamRating> {
  const stats: Record<string, { goalDiff: number; xGoalDiff: number; n: number }> = {};

  for (const m of playedMatches) {
    if (!m.homeCode || !m.awayCode || m.homeScore == null || m.awayScore == null) continue;
    const home = ratings[m.homeCode];
    const away = ratings[m.awayCode];
    if (!home || !away) continue;

    const hostBoost = HOST_CODES.has(home.code) ? homeAdvantage : 0;
    const awayBoost = HOST_CODES.has(away.code) ? homeAdvantage : 0;
    const xHome = Math.exp(home.attack - away.defense + hostBoost);
    const xAway = Math.exp(away.attack - home.defense + awayBoost);

    (stats[m.homeCode] ??= { goalDiff: 0, xGoalDiff: 0, n: 0 });
    (stats[m.awayCode] ??= { goalDiff: 0, xGoalDiff: 0, n: 0 });
    stats[m.homeCode].goalDiff += m.homeScore - m.awayScore;
    stats[m.homeCode].xGoalDiff += xHome - xAway;
    stats[m.homeCode].n += 1;
    stats[m.awayCode].goalDiff += m.awayScore - m.homeScore;
    stats[m.awayCode].xGoalDiff += xAway - xHome;
    stats[m.awayCode].n += 1;
  }

  const adjusted: Record<string, TeamRating> = {};
  for (const code of Object.keys(ratings)) {
    const s = stats[code];
    if (!s) {
      adjusted[code] = ratings[code];
      continue;
    }
    // average goal-difference surprise per match, damped by sample size so
    // 1-2 group games barely move the needle and a full run does more
    const residual = (s.goalDiff - s.xGoalDiff) / s.n;
    const confidence = Math.min(s.n / 6, 1);
    const shift = Math.max(-0.4, Math.min(0.4, residual * confidence * 0.15));
    adjusted[code] = {
      code,
      attack: ratings[code].attack + shift / 2,
      defense: ratings[code].defense + shift / 2,
    };
  }
  return adjusted;
}

export interface PlayedOutMatch extends SimulatedResult {
  matchNumber: number;
  phase: MatchPhase;
  homeCode: string;
  awayCode: string;
}

/**
 * Play the remaining bracket out once. Returns every simulated match and the
 * champion. Throws if a slot references a team without a rating.
 */
export function playOutBracket(
  bracket: BracketMatch[],
  ratings: Record<string, TeamRating>,
  homeAdvantage: number,
  random: () => number = Math.random,
): { results: PlayedOutMatch[]; champion: string } {
  const winners = new Map<number, string>();
  const results: PlayedOutMatch[] = [];

  const resolve = (slot: Slot): string => {
    if ("code" in slot) return slot.code;
    const w = winners.get(slot.winnerOf);
    if (!w) throw new Error(`Match ${slot.winnerOf} has no winner yet`);
    return w;
  };

  for (const m of bracket) {
    const homeCode = resolve(m.home);
    const awayCode = resolve(m.away);
    const result = simulateKnockoutMatch(
      ratings[homeCode],
      ratings[awayCode],
      homeAdvantage,
      random,
    );
    winners.set(m.matchNumber, result.winnerCode);
    results.push({ ...result, matchNumber: m.matchNumber, phase: m.phase, homeCode, awayCode });
  }

  const finalMatch = bracket[bracket.length - 1];
  return { results, champion: winners.get(finalMatch.matchNumber)! };
}
