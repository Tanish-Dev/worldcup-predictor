import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import type {
  Groups,
  HistoricalMatch,
  Meta,
  PlayerStat,
  Team,
  TournamentHistoryEntry,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const contents = await readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(contents) as T;
}

export const getTeams = cache(async (): Promise<Team[]> => {
  return readJson<Team[]>("teams.json");
});

export const getGroups = cache(async (): Promise<Groups> => {
  return readJson<Groups>("groups.json");
});

export const getMeta = cache(async (): Promise<Meta> => {
  return readJson<Meta>("meta.json");
});

export const getHistory = cache(async (): Promise<TournamentHistoryEntry[]> => {
  return readJson<TournamentHistoryEntry[]>("history.json");
});

export const getMatches = cache(async (): Promise<HistoricalMatch[]> => {
  return readJson<HistoricalMatch[]>("matches.json");
});

export const getPlayers = cache(async (): Promise<PlayerStat[]> => {
  return readJson<PlayerStat[]>("players.json");
});

export async function getTeamByCode(code: string): Promise<Team | undefined> {
  const teams = await getTeams();
  return teams.find((t) => t.code.toLowerCase() === code.toLowerCase());
}

export function findTeamByName(teams: Team[], name: string): Team | undefined {
  return teams.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

export async function getTeamMatches(teamName: string): Promise<HistoricalMatch[]> {
  const matches = await getMatches();
  return matches
    .filter((m) => m.homeTeam === teamName || m.awayTeam === teamName)
    .sort((a, b) => b.year - a.year);
}
