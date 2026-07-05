import { cache } from "react";

export type MatchEventKind =
  | "goal"
  | "ownGoal"
  | "penaltyGoal"
  | "assist"
  | "yellowCard"
  | "redCard"
  | "substitution";

export interface MatchEvent {
  minute: string;
  kind: MatchEventKind;
  /** FIFA's internal numeric team id the event is attributed to */
  teamId: string;
  /** Full sentence from FIFA's own live feed, e.g. "Harry KANE (England) successfully converts the penalty!" */
  text: string;
}

const KIND_BY_TYPE: Record<number, MatchEventKind> = {
  0: "goal",
  34: "ownGoal",
  41: "penaltyGoal",
  1: "assist",
  2: "yellowCard",
  3: "redCard",
  5: "substitution",
};

/** Player's/scorer's name out of FIFA's "NAME (Country) ..." / "Assisted by NAME." sentences. */
export function extractEventName(kind: MatchEventKind, text: string): string | null {
  if (kind === "assist") {
    return text.match(/^Assisted by (.+)\.$/)?.[1]?.trim() ?? null;
  }
  return text.match(/^(.+?) \(/)?.[1]?.trim() ?? null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseEvent(raw: any): MatchEvent | null {
  const kind = KIND_BY_TYPE[raw.Type];
  const text: string | undefined = raw.EventDescription?.[0]?.Description;
  if (!kind || !text || !raw.IdTeam) return null;
  return {
    minute: raw.MatchMinute || "",
    kind,
    teamId: raw.IdTeam,
    text,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Goal-by-goal event timeline for a single match, straight from FIFA's live
 * feed. Cached per (idStage, idMatch) and revalidated every 5 minutes like
 * the rest of the live data.
 */
export const getMatchEvents = cache(
  async (idStage: string, idMatch: string): Promise<MatchEvent[]> => {
    const url = `https://api.fifa.com/api/v3/timelines/17/285023/${idStage}/${idMatch}?language=en`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.Event ?? []) as unknown[])
      .map(parseEvent)
      .filter((e): e is MatchEvent => e !== null);
  },
);
