"""
World Cup 2026 champion predictor - data pipeline.

Trains a Poisson attack/defense goal-scoring model on 1930-2022 World Cup
results, calibrates it against current FIFA ranking points for teams with
little or no World Cup history, then runs a Monte Carlo simulation of the
2026 group stage + knockout bracket to estimate each team's probability of
reaching every stage of the tournament, including winning it outright.

Run: python3 pipeline.py
Outputs JSON files consumed by the Next.js app into ../data/
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, PoissonRegressor

RAW = Path(__file__).parent / "data-raw"
OUT = Path(__file__).parent.parent / "data"
OUT.mkdir(exist_ok=True)

HOST_NATIONS = {"United States", "Mexico", "Canada"}
N_SIMULATIONS = 50000
RNG = np.random.default_rng(42)

# 2026 schedule uses names that occasionally differ from the FIFA ranking
# file and/or the historical results file. Map schedule name -> ranking name,
# and schedule name -> list of historical-results aliases (a team can span
# more than one historical name, e.g. Czechoslovakia -> Czech Republic -> Czechia).
RANKING_ALIAS = {
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Cape Verde": "Cabo Verde",
    "United States": "USA",
}
HISTORY_ALIASES = {
    "Bosnia-Herzegovina": ["Bosnia and Herzegovina"],
    "Czechia": ["Czech Republic", "Czechoslovakia"],
    "Cape Verde": [],
    "Congo DR": [],
    "Curaçao": [],
    "Jordan": [],
    "Uzbekistan": [],
}


def load_schedule() -> pd.DataFrame:
    return pd.read_csv(RAW / "schedule_2026.csv")


def derive_groups(schedule: pd.DataFrame) -> dict[str, list[str]]:
    """Group stage fixtures form a complete graph (6 matches) within each
    group of 4 teams and no matches across groups, so groups fall out as the
    connected components of the "who plays whom" graph."""
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for _, row in schedule.iterrows():
        union(row["home_team"], row["away_team"])

    teams = sorted(set(schedule["home_team"]) | set(schedule["away_team"]))
    buckets: dict[str, list[str]] = {}
    for t in teams:
        buckets.setdefault(find(t), []).append(t)

    ordered = sorted(buckets.values(), key=lambda ts: min(ts))
    return {chr(ord("A") + i): sorted(ts) for i, ts in enumerate(ordered)}


def canonicalize_historical_matches(matches: pd.DataFrame) -> pd.DataFrame:
    """Relabel historical team names onto their 2026 canonical name so a
    team's full history (e.g. Czechoslovakia + Czech Republic) counts
    towards one rating."""
    rename = {}
    for canonical, aliases in HISTORY_ALIASES.items():
        for alias in aliases:
            rename[alias] = canonical
    matches = matches.copy()
    matches["home_team"] = matches["home_team"].replace(rename)
    matches["away_team"] = matches["away_team"].replace(rename)
    return matches


def fit_attack_defense(matches: pd.DataFrame) -> tuple[dict, dict, float]:
    """Fit a Maher-style Poisson goal model: for a match between team i (at
    home) and team j, home goals ~ Poisson(exp(attack_i - defense_j + home_adv))
    and away goals ~ Poisson(exp(attack_j - defense_i)). Returns per-team
    attack/defense ratings (log scale) plus the fitted home-advantage term.
    """
    matches = matches.dropna(subset=["home_score", "away_score"])

    rows = []
    for _, m in matches.iterrows():
        hosts_that_year = {h.strip() for h in str(m["Host"]).split(",")}
        is_host_home = m["home_team"] in hosts_that_year
        is_host_away = m["away_team"] in hosts_that_year
        rows.append({"team": m["home_team"], "opponent": m["away_team"],
                      "goals": m["home_score"], "is_home": 1 if is_host_home else 0})
        rows.append({"team": m["away_team"], "opponent": m["home_team"],
                      "goals": m["away_score"], "is_home": 1 if is_host_away else 0})
    long = pd.DataFrame(rows)

    team_dummies = pd.get_dummies(long["team"], prefix="atk")
    opp_dummies = pd.get_dummies(long["opponent"], prefix="def")
    X = pd.concat([team_dummies, opp_dummies, long[["is_home"]]], axis=1)
    y = long["goals"].astype(float)

    model = PoissonRegressor(alpha=0.05, max_iter=2000)
    model.fit(X, y)

    coefs = dict(zip(X.columns, model.coef_))
    teams = sorted(set(long["team"]) | set(long["opponent"]))
    attack = {t: coefs.get(f"atk_{t}", 0.0) for t in teams}
    # opponent coefficient = how many goals a team lets its opponents score,
    # i.e. defensive weakness; flip sign so higher defense = better.
    defense = {t: -coefs.get(f"def_{t}", 0.0) for t in teams}
    home_adv = float(model.coef_[X.columns.get_loc("is_home")])
    return attack, defense, home_adv


def calibrate_cold_start(attack: dict, defense: dict, matches_played: dict,
                          fifa_points: dict, team_2026: list[str]) -> tuple[dict, dict]:
    """Blend the historical Poisson rating with a FIFA-points-only estimate,
    weighted towards FIFA points for teams with little or no World Cup
    history (new/rare qualifiers). The FIFA-points estimate itself is a
    linear calibration fitted on teams that have both signals."""
    calib_rows = [(fifa_points[t], attack.get(t, 0.0), defense.get(t, 0.0))
                  for t in team_2026 if matches_played.get(t, 0) >= 8]
    pts = np.array([[r[0]] for r in calib_rows])
    atk_y = np.array([r[1] for r in calib_rows])
    def_y = np.array([r[2] for r in calib_rows])

    atk_line = LinearRegression().fit(pts, atk_y)
    def_line = LinearRegression().fit(pts, def_y)

    final_attack, final_defense = {}, {}
    for t in team_2026:
        n = matches_played.get(t, 0)
        weight_hist = min(1.0, n / 12)
        fifa_atk = float(atk_line.predict([[fifa_points[t]]])[0])
        fifa_def = float(def_line.predict([[fifa_points[t]]])[0])
        final_attack[t] = weight_hist * attack.get(t, fifa_atk) + (1 - weight_hist) * fifa_atk
        final_defense[t] = weight_hist * defense.get(t, fifa_def) + (1 - weight_hist) * fifa_def
    return final_attack, final_defense


def simulate_match(attack: dict, defense: dict, home_adv: float,
                    team_a: str, team_b: str, a_is_host: bool, knockout: bool,
                    n: int) -> tuple[np.ndarray, np.ndarray]:
    lam_a = np.exp(attack[team_a] - defense[team_b] + (home_adv if a_is_host else 0))
    lam_b = np.exp(attack[team_b] - defense[team_a])
    goals_a = RNG.poisson(lam_a, size=n)
    goals_b = RNG.poisson(lam_b, size=n)
    if knockout:
        ties = goals_a == goals_b
        # Penalty shootout: mildly favors the stronger team rather than a flat coin flip.
        strength_a = attack[team_a] + defense[team_a]
        strength_b = attack[team_b] + defense[team_b]
        p_a_wins_pens = 1 / (1 + np.exp(-(strength_a - strength_b)))
        a_wins_shootout = RNG.random(n) < p_a_wins_pens
        # Bump the shootout winner's tally by 1 so a plain `ga > gb` comparison
        # downstream still resolves to the correct winner.
        goals_a = np.where(ties & a_wins_shootout, goals_a + 1, goals_a)
        goals_b = np.where(ties & ~a_wins_shootout, goals_b + 1, goals_b)
    return goals_a, goals_b


def run_simulation(groups: dict[str, list[str]], attack: dict, defense: dict,
                    home_adv: float, n: int) -> dict:
    all_teams = [t for ts in groups.values() for t in ts]
    stage_reached = {t: {"group_winner": 0, "round_of_32": 0, "round_of_16": 0,
                          "quarterfinal": 0, "semifinal": 0, "final": 0, "champion": 0}
                      for t in all_teams}

    fixtures_by_group = {}
    for g, teams in groups.items():
        fixtures_by_group[g] = [(teams[i], teams[j])
                                 for i in range(4) for j in range(i + 1, 4)]

    for sim in range(n):
        advancing = []
        third_place_rows = []

        for g, teams in groups.items():
            points = {t: 0 for t in teams}
            gd = {t: 0 for t in teams}
            gf = {t: 0 for t in teams}
            for a, b in fixtures_by_group[g]:
                ga, gb = simulate_match(attack, defense, home_adv, a, b,
                                         a_is_host=a in HOST_NATIONS, knockout=False, n=1)
                ga, gb = int(ga[0]), int(gb[0])
                gf[a] += ga
                gf[b] += gb
                gd[a] += ga - gb
                gd[b] += gb - ga
                if ga > gb:
                    points[a] += 3
                elif gb > ga:
                    points[b] += 3
                else:
                    points[a] += 1
                    points[b] += 1
            ranked = sorted(teams, key=lambda t: (points[t], gd[t], gf[t]), reverse=True)
            advancing.append(ranked[0])
            advancing.append(ranked[1])
            stage_reached[ranked[0]]["group_winner"] += 1
            third_place_rows.append((ranked[2], points[ranked[2]], gd[ranked[2]], gf[ranked[2]]))

        third_place_rows.sort(key=lambda r: (r[1], r[2], r[3]), reverse=True)
        best_thirds = [r[0] for r in third_place_rows[:8]]
        round_of_32 = advancing + best_thirds
        for t in round_of_32:
            stage_reached[t]["round_of_32"] += 1

        bracket = list(round_of_32)
        RNG.shuffle(bracket)

        round_name_order = ["round_of_16", "quarterfinal", "semifinal", "final"]
        current = bracket
        for round_name in round_name_order:
            next_round = []
            for i in range(0, len(current), 2):
                a, b = current[i], current[i + 1]
                ga, gb = simulate_match(attack, defense, home_adv, a, b,
                                         a_is_host=a in HOST_NATIONS, knockout=True, n=1)
                winner = a if ga[0] > gb[0] else b
                next_round.append(winner)
            for t in next_round:
                stage_reached[t][round_name] += 1
            current = next_round

        champion = current[0]
        stage_reached[champion]["champion"] += 1

    return stage_reached


def main() -> None:
    print("Loading data...")
    schedule = load_schedule()
    groups = derive_groups(schedule)
    team_2026 = sorted(t for ts in groups.values() for t in ts)

    rank26 = pd.read_csv(RAW / "fifa_ranking_2026-06-08.csv").set_index("team")
    matches_raw = pd.read_csv(RAW / "matches_1930_2022.csv")
    matches = canonicalize_historical_matches(matches_raw)
    world_cups = pd.read_csv(RAW / "world_cup.csv")

    print("Fitting Poisson attack/defense model on 1930-2022 results...")
    attack, defense, home_adv = fit_attack_defense(matches)

    matches_played = {}
    for t in team_2026:
        n = ((matches["home_team"] == t) | (matches["away_team"] == t)).sum()
        matches_played[t] = int(n)

    fifa_points = {t: float(rank26.loc[RANKING_ALIAS.get(t, t), "points"]) for t in team_2026}
    fifa_rank = {t: int(rank26.loc[RANKING_ALIAS.get(t, t), "rank"]) for t in team_2026}
    team_code = {t: str(rank26.loc[RANKING_ALIAS.get(t, t), "team_code"]) for t in team_2026}
    confederation = {t: str(rank26.loc[RANKING_ALIAS.get(t, t), "association"]) for t in team_2026}

    print("Calibrating cold-start teams against FIFA ranking points...")
    final_attack, final_defense = calibrate_cold_start(
        attack, defense, matches_played, fifa_points, team_2026)

    print(f"Running Monte Carlo simulation ({N_SIMULATIONS} trials)...")
    stage_reached = run_simulation(groups, final_attack, final_defense,
                                    max(home_adv, 0.0), N_SIMULATIONS)

    print("Assembling championship history & per-team historical matches...")
    team_group = {t: g for g, ts in groups.items() for t in ts}
    champions_count: dict[str, int] = {}
    runner_up_count: dict[str, int] = {}
    for _, row in world_cups.iterrows():
        champions_count[row["Champion"]] = champions_count.get(row["Champion"], 0) + 1
        runner_up_count[row["Runner-Up"]] = runner_up_count.get(row["Runner-Up"], 0) + 1

    teams_out = []
    for t in team_2026:
        power = final_attack[t] + final_defense[t]
        teams_out.append({
            "name": t,
            "code": team_code[t],
            "confederation": confederation[t],
            "group": team_group[t],
            "fifaRank": fifa_rank[t],
            "fifaPoints": round(fifa_points[t], 1),
            "attackRating": round(final_attack[t], 3),
            "defenseRating": round(final_defense[t], 3),
            "powerRating": round(power, 3),
            "worldCupsPlayed": 0,  # filled below
            "titles": champions_count.get(t, 0),
            "runnerUps": runner_up_count.get(t, 0),
            "isHost": t in HOST_NATIONS,
            "isDebutant": matches_played[t] == 0,
            "predictions": {
                "groupWinner": round(stage_reached[t]["group_winner"] / N_SIMULATIONS, 4),
                "roundOf32": round(stage_reached[t]["round_of_32"] / N_SIMULATIONS, 4),
                "roundOf16": round(stage_reached[t]["round_of_16"] / N_SIMULATIONS, 4),
                "quarterfinal": round(stage_reached[t]["quarterfinal"] / N_SIMULATIONS, 4),
                "semifinal": round(stage_reached[t]["semifinal"] / N_SIMULATIONS, 4),
                "final": round(stage_reached[t]["final"] / N_SIMULATIONS, 4),
                "champion": round(stage_reached[t]["champion"] / N_SIMULATIONS, 4),
            },
        })

    appearances_by_team: dict[str, set] = {}
    for _, m in matches.iterrows():
        for side in ("home_team", "away_team"):
            appearances_by_team.setdefault(m[side], set()).add(m["Year"])
    for t in teams_out:
        years = appearances_by_team.get(t["name"], set())
        t["worldCupsPlayed"] = len(years)

    teams_out.sort(key=lambda t: t["predictions"]["champion"], reverse=True)

    matches_out = []
    for _, m in matches.iterrows():
        if m["home_team"] in team_2026 or m["away_team"] in team_2026:
            matches_out.append({
                "year": int(m["Year"]),
                "round": m["Round"],
                "homeTeam": m["home_team"],
                "awayTeam": m["away_team"],
                "homeScore": int(m["home_score"]) if pd.notna(m["home_score"]) else None,
                "awayScore": int(m["away_score"]) if pd.notna(m["away_score"]) else None,
                "host": m["Host"],
            })

    history_out = []
    for _, row in world_cups.iterrows():
        history_out.append({
            "year": int(row["Year"]),
            "host": row["Host"],
            "teams": int(row["Teams"]),
            "champion": row["Champion"],
            "runnerUp": row["Runner-Up"],
            "topScorer": row["TopScorrer"],
            "attendance": int(row["Attendance"]) if pd.notna(row["Attendance"]) else None,
            "matches": int(row["Matches"]) if pd.notna(row["Matches"]) else None,
        })

    groups_out = {g: ts for g, ts in groups.items()}

    predicted_champion = teams_out[0]
    top_4 = teams_out[:4]

    meta_out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "simulations": N_SIMULATIONS,
        "homeAdvantage": round(home_adv, 4),
        "predictedChampion": predicted_champion["name"],
        "topContenders": [t["name"] for t in top_4],
        "methodology": (
            "Team attack/defense ratings come from a Poisson goal-scoring model "
            "(scikit-learn PoissonRegressor, L2-regularized) fitted on all World Cup "
            "matches from 1930-2022. Teams with little or no World Cup history are "
            "calibrated against a linear fit between FIFA ranking points and the "
            "historical ratings of teams that have both. The 2026 tournament (12 groups "
            "of 4, top 2 plus 8 best third-place teams advance to a 32-team knockout) is "
            "simulated 20,000 times end-to-end with goals drawn from each team's fitted "
            "scoring rate; the round-of-32 bracket pairings are randomized each run since "
            "the official cross-group draw sheet depends on live group results. Knockout "
            "ties are broken by a simulated penalty shootout weighted toward the stronger side."
        ),
    }

    print("Writing JSON output...")
    (OUT / "teams.json").write_text(json.dumps(teams_out, indent=2))
    (OUT / "groups.json").write_text(json.dumps(groups_out, indent=2))
    (OUT / "history.json").write_text(json.dumps(history_out, indent=2))
    (OUT / "matches.json").write_text(json.dumps(matches_out, indent=2))
    (OUT / "meta.json").write_text(json.dumps(meta_out, indent=2))
    print(f"Done. Predicted champion: {predicted_champion['name']} "
          f"({predicted_champion['predictions']['champion']*100:.1f}% of simulations)")


if __name__ == "__main__":
    main()
