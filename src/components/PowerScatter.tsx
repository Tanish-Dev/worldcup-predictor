"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Team } from "@/lib/types";
import {
  CONFEDERATION_COLOR_VAR,
  CONFEDERATION_NAMES,
  CONFEDERATION_ORDER,
} from "@/lib/confederations";

interface TooltipPayloadItem {
  payload: Team;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const team = payload[0].payload;
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm shadow-lg">
      <p className="font-medium">{team.name}</p>
      <p className="text-ink-secondary">FIFA rank #{team.fifaRank}</p>
      <p className="text-ink-secondary">Power rating {team.powerRating.toFixed(2)}</p>
      <p className="tabular text-ink-secondary">
        Champion odds {(team.predictions.champion * 100).toFixed(1)}%
      </p>
    </div>
  );
}

function TeamDot({ cx, cy, payload }: { cx: number; cy: number; payload: Team }) {
  const color = CONFEDERATION_COLOR_VAR[payload.confederation] ?? "var(--series-blue)";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />;
}

export default function PowerScatter({ teams }: { teams: Team[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" strokeDasharray="0" vertical={false} />
          <XAxis
            type="number"
            dataKey="fifaRank"
            name="FIFA rank"
            reversed
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            stroke="var(--axis)"
            label={{
              value: "FIFA rank (higher = stronger) →",
              position: "insideBottom",
              offset: -8,
              fill: "var(--ink-muted)",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="powerRating"
            name="Power rating"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            stroke="var(--axis)"
            label={{
              value: "Model power rating →",
              angle: -90,
              position: "insideLeft",
              fill: "var(--ink-muted)",
              fontSize: 12,
            }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--axis)" }} />
          <Scatter
            data={teams}
            shape={(props: unknown) => <TeamDot {...(props as { cx: number; cy: number; payload: Team })} />}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {CONFEDERATION_ORDER.map((c) => (
          <div key={c} className="flex items-center gap-2 text-sm text-ink-secondary">
            <svg width="10" height="10" aria-hidden>
              <circle cx="5" cy="5" r="5" fill={CONFEDERATION_COLOR_VAR[c]} />
            </svg>
            {CONFEDERATION_NAMES[c]}
          </div>
        ))}
      </div>
    </div>
  );
}
