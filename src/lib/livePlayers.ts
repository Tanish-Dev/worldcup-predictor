import { cache } from "react";
import { getLiveTournament } from "./fifa";
import { getMatchEvents, extractEventName } from "./matchEvents";

export interface LivePlayerStat {
  name: string;
  teamCode: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

/**
 * Goals/assists/cards for the 2026 tournament so far, aggregated from FIFA's
 * own live event feed for every played (or in-progress) match. Own goals
 * count on the scoreboard but aren't credited to the scorer, matching the
 * usual top-scorer convention used on the all-time table.
 */
export const getLivePlayerStats = cache(async (): Promise<LivePlayerStat[]> => {
  const live = await getLiveTournament();

  const teamCodeById: Record<string, string> = {};
  for (const m of live.matches) {
    if (m.homeTeamId && m.homeCode) teamCodeById[m.homeTeamId] = m.homeCode;
    if (m.awayTeamId && m.awayCode) teamCodeById[m.awayTeamId] = m.awayCode;
  }

  const played = live.matches.filter((m) => m.status === "played" || m.status === "live");
  const eventLists = await Promise.all(
    played.map((m) => getMatchEvents(m.idStage, m.idMatch)),
  );

  const stats = new Map<string, LivePlayerStat>();
  const bump = (
    name: string,
    teamCode: string,
    field: "goals" | "assists" | "yellowCards" | "redCards",
  ) => {
    const key = `${name}|${teamCode}`;
    let row = stats.get(key);
    if (!row) {
      row = { name, teamCode, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      stats.set(key, row);
    }
    row[field] += 1;
  };

  for (const events of eventLists) {
    for (const e of events) {
      const teamCode = teamCodeById[e.teamId];
      if (!teamCode) continue;
      const name = extractEventName(e.kind, e.text);
      if (!name) continue;
      if (e.kind === "goal" || e.kind === "penaltyGoal") bump(name, teamCode, "goals");
      else if (e.kind === "assist") bump(name, teamCode, "assists");
      else if (e.kind === "yellowCard") bump(name, teamCode, "yellowCards");
      else if (e.kind === "redCard") bump(name, teamCode, "redCards");
    }
  }

  return [...stats.values()];
});
