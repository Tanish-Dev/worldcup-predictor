# 2026 World Cup Predictor

Who wins the 2026 FIFA World Cup — from here? This project trains a
goal-scoring model on every World Cup match since 1930, then combines it with
**live results from FIFA's public API**: matches already played are locked in
as fact, and only the remaining bracket is simulated (20,000 times per
refresh) to produce up-to-the-round title odds for every surviving team.

**Stack:** Next.js (App Router, Server Components, fetch revalidation/ISR,
Server/Client boundary), TypeScript, Tailwind CSS, Recharts &middot;
Python/scikit-learn for the model.

## How it works

1. **`model/pipeline.py`** fits a Poisson attack/defense rating for every team
   on 964 historical World Cup matches (scikit-learn `PoissonRegressor`),
   calibrates cold-start teams (debutants, sparse history) against FIFA
   ranking points, fits a home-advantage term from each match's actual host
   nation, then Monte Carlo simulates the pre-tournament bracket 50,000 times
   and writes the results to `data/*.json`.
2. **`src/lib/fifa.ts`** pulls the live 2026 match feed (results, scores,
   penalty shootouts, the real knockout bracket, team flags) from FIFA's
   public API, cached with Next.js `fetch` revalidation (5 minutes) so every
   page is static-fast but never more than a few minutes stale.
3. **`src/lib/liveOdds.ts`** re-simulates only the matches FIFA still lists as
   unplayed, server-side, conditioning the title odds on everything already
   decided on the pitch.
4. **`src/lib/bracket.ts`** is the shared simulation engine — the same code
   powers the server-side odds and the client-side "play out one ending"
   button on `/bracket`.

Full methodology write-up: `/methodology` in the running app.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Regenerating the model

The prediction data in `data/` is checked in, so the app runs without Python.
To regenerate it (e.g. after updating the source CSVs in `model/data-raw/`):

```bash
cd model
pip install -r requirements.txt
python3 pipeline.py
```

## Project structure

```
model/               Python data pipeline (training + simulation)
data/                Generated JSON consumed by the app
src/app/             Routes: home, rankings, teams/[code], bracket, history, methodology
src/components/      UI components (charts, tables, nav)
src/lib/             Data access layer + client-side simulation
```
