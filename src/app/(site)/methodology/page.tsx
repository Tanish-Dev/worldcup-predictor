import { getMeta } from "@/lib/data";

export const metadata = {
  title: "Methodology — 2026 World Cup Predictor",
};

export default async function MethodologyPage() {
  const meta = await getMeta();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight">How this works</h1>

      <div className="glass mt-8 space-y-6 rounded-3xl p-6 text-ink-secondary sm:p-8">
        <p>
          Every team gets an <strong className="text-ink-primary">attack rating</strong>{" "}
          and a <strong className="text-ink-primary">defense rating</strong> from a
          Poisson goal-scoring model (a scikit-learn{" "}
          <code className="rounded bg-surface-raised px-1.5 py-0.5 text-sm">
            PoissonRegressor
          </code>
          ), fitted on all 964 World Cup matches from 1930 to 2022. The model
          learns, from history, how many goals a team tends to score against a
          given opponent&apos;s defense — the same family of model used by most
          public football-prediction projects (Maher, 1982; Dixon-Coles, 1997).
        </p>
        <p>
          Teams with little or no World Cup history — this year&apos;s five
          debutants, plus a handful of teams with only a few matches on record —
          can&apos;t be rated from history alone. For those, attack and defense
          are predicted from a linear calibration between FIFA ranking points
          and the fitted ratings of teams that have both signals, blended in
          proportionally to how many World Cup matches a team has actually
          played.
        </p>
        <p>
          A home-advantage term is fitted the same way, using each historical
          match&apos;s actual host nation — it came out to{" "}
          <strong className="text-ink-primary">
            +{(meta.homeAdvantage * 100).toFixed(1)}%
          </strong>{" "}
          on the goal-scoring rate, and is applied to co-hosts USA, Mexico, and
          Canada for their 2026 matches.
        </p>
        <p>
          With every team rated, the 2026 tournament — 12 groups of 4, the top
          2 plus the best 8 third-place teams advancing to a 32-team knockout —
          is simulated end-to-end{" "}
          <strong className="text-ink-primary">
            {meta.simulations.toLocaleString()} times
          </strong>
          . Each simulated match draws a goal count for each side from a
          Poisson distribution at that team&apos;s fitted scoring rate; group
          standings use the standard points → goal difference → goals-for
          tiebreak; knockout ties go to a simulated penalty shootout, weighted
          toward (but not decided by) the stronger side. A team&apos;s
          probability of reaching any stage is just the share of those{" "}
          {meta.simulations.toLocaleString()} runs where it got there.
        </p>
        <p>
          <strong className="text-ink-primary">Live conditioning.</strong> Once
          the tournament kicked off, pre-tournament odds go stale fast — so the
          app also pulls every match result from FIFA&apos;s public API (cached
          for five minutes via Next.js fetch revalidation). Matches that have
          been played are locked in as fact, the real knockout bracket replaces
          the randomized pre-tournament draw, and only the remaining matches
          are simulated — 20,000 times, server-side, on each refresh. That is
          the &ldquo;title odds now&rdquo; number you see next to the
          pre-tournament one.
        </p>
        <p>
          One deliberate simplification in the pre-tournament numbers: the
          official round-of-32 draw sheet
          assigns knockout matchups to specific group-position slots (e.g.
          &ldquo;runner-up of Group A plays a third-place qualifier&rdquo;) in a
          way that depends on which groups the third-place teams actually come
          from. That document isn&apos;t modeled here — instead, the 32
          advancing teams are randomly paired into the round of 32 on each
          simulation. It changes exactly who a team might face in the first
          knockout round, not how strong the field is overall.
        </p>
        <p className="text-sm text-ink-muted">
          Model last generated {new Date(meta.generatedAt).toLocaleString()}.
        </p>
      </div>
    </div>
  );
}
