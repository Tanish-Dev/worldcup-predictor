export const CONFEDERATION_ORDER = [
  "UEFA",
  "CONMEBOL",
  "CONCACAF",
  "CAF",
  "AFC",
  "OFC",
] as const;

export const CONFEDERATION_COLOR_VAR: Record<string, string> = {
  UEFA: "var(--series-blue)",
  CONMEBOL: "var(--series-aqua)",
  CONCACAF: "var(--series-yellow)",
  CAF: "var(--series-green)",
  AFC: "var(--series-violet)",
  OFC: "var(--series-red)",
};

export const CONFEDERATION_NAMES: Record<string, string> = {
  UEFA: "UEFA (Europe)",
  CONMEBOL: "CONMEBOL (South America)",
  CONCACAF: "CONCACAF (North/Central America)",
  CAF: "CAF (Africa)",
  AFC: "AFC (Asia)",
  OFC: "OFC (Oceania)",
};
