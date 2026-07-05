import { getHistory } from "@/lib/data";
import ProbabilityBar from "@/components/ProbabilityBar";

export const metadata = {
  title: "History — 2026 World Cup Predictor",
};

export default async function HistoryPage() {
  const history = await getHistory();
  const sorted = [...history].sort((a, b) => b.year - a.year);

  const titleCounts = new Map<string, number>();
  for (const h of history) {
    titleCounts.set(h.champion, (titleCounts.get(h.champion) ?? 0) + 1);
  }
  const maxTitles = Math.max(...titleCounts.values());
  const titlesRanked = [...titleCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-3xl font-medium tracking-tight">World Cup history</h1>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        Every tournament since 1930 — the data the model was trained on.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-medium tracking-tight">Titles by country</h2>
        <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
          <div className="space-y-3">
            {titlesRanked.map(([country, count]) => (
              <ProbabilityBar
                key={country}
                label={country}
                value={count / maxTitles}
                labelClassName="w-36 shrink-0 text-sm text-ink-primary"
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Bars are scaled to the all-time leader ({titlesRanked[0][0]}, {titlesRanked[0][1]}{" "}
            titles), not a probability.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-medium tracking-tight">Every tournament</h2>
        <div className="glass mt-6 overflow-x-auto rounded-3xl p-5 sm:p-6">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="py-3 pr-4 font-normal">Year</th>
                <th className="py-3 pr-4 font-normal">Host</th>
                <th className="py-3 pr-4 font-normal">Champion</th>
                <th className="py-3 pr-4 font-normal">Runner-up</th>
                <th className="py-3 pr-4 font-normal">Top scorer</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.year} className="border-b border-border/60">
                  <td className="tabular py-3 pr-4 text-ink-muted">{h.year}</td>
                  <td className="py-3 pr-4 text-ink-secondary">{h.host}</td>
                  <td className="py-3 pr-4 font-medium">{h.champion}</td>
                  <td className="py-3 pr-4 text-ink-secondary">{h.runnerUp}</td>
                  <td className="py-3 pr-4 text-ink-secondary">{h.topScorer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
