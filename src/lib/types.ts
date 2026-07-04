export interface TeamPredictions {
  groupWinner: number;
  roundOf32: number;
  roundOf16: number;
  quarterfinal: number;
  semifinal: number;
  final: number;
  champion: number;
}

export interface Team {
  name: string;
  code: string;
  confederation: string;
  group: string;
  fifaRank: number;
  fifaPoints: number;
  attackRating: number;
  defenseRating: number;
  powerRating: number;
  worldCupsPlayed: number;
  titles: number;
  runnerUps: number;
  isHost: boolean;
  isDebutant: boolean;
  predictions: TeamPredictions;
}

export type Groups = Record<string, string[]>;

export interface HistoricalMatch {
  year: number;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  host: string;
}

export interface TournamentHistoryEntry {
  year: number;
  host: string;
  teams: number;
  champion: string;
  runnerUp: string;
  topScorer: string;
  attendance: number | null;
  matches: number | null;
}

export type MatchPhase =
  | "Group stage"
  | "Round of 32"
  | "Round of 16"
  | "Quarterfinal"
  | "Semifinal"
  | "Third place"
  | "Final";

export interface LiveMatch {
  matchNumber: number;
  phase: MatchPhase;
  group: string | null;
  date: string;
  status: "played" | "live" | "scheduled";
  homeCode: string | null;
  awayCode: string | null;
  homeName: string | null;
  awayName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  winnerCode: string | null;
  /** Stadium name, e.g. "Miami Stadium" */
  venue: string | null;
  city: string | null;
  /** Current minute while live, e.g. "86'" */
  matchTime: string | null;
  /** For unresolved knockout slots: "W89" = winner of match 89 */
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
}

export type TeamStatus =
  | { kind: "alive"; phase: MatchPhase }
  | { kind: "eliminated"; phase: MatchPhase }
  | { kind: "champion" };

export interface LiveTournament {
  fetchedAt: string;
  matches: LiveMatch[];
  /** codes of teams still in the tournament */
  alive: string[];
  status: Record<string, TeamStatus>;
  currentPhase: MatchPhase;
}

export interface LiveOdds {
  simulations: number;
  /** per team code: probability of winning each remaining round and the title */
  byTeam: Record<
    string,
    { quarterfinal: number; semifinal: number; final: number; champion: number }
  >;
  /** per upcoming match number: probability the home slot wins */
  matchHomeWinProb: Record<number, number>;
}

export interface Meta {
  generatedAt: string;
  simulations: number;
  homeAdvantage: number;
  predictedChampion: string;
  topContenders: string[];
  methodology: string;
}
