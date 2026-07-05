import { getTeams } from "@/lib/data";
import { getLiveTournament } from "@/lib/fifa";
import VenuesBrowser, { type VenueGroup } from "@/components/VenuesBrowser";

export const metadata = {
  title: "Venues — 2026 World Cup Predictor",
};

export default async function VenuesPage() {
  const [teams, live] = await Promise.all([getTeams(), getLiveTournament()]);
  const byCode = Object.fromEntries(teams.map((t) => [t.code, t]));

  const byVenue = new Map<string, VenueGroup>();
  for (const m of live.matches) {
    if (!m.venue) continue;
    const entry = byVenue.get(m.venue) ?? {
      venue: m.venue,
      city: m.city ?? "",
      matches: [],
    };
    entry.matches.push({
      matchNumber: m.matchNumber,
      phase: m.phase,
      group: m.group,
      date: m.date,
      status: m.status,
      homeCode: m.homeCode,
      awayCode: m.awayCode,
      homeTeamName: (m.homeCode && byCode[m.homeCode]?.name) || m.homeName,
      awayTeamName: (m.awayCode && byCode[m.awayCode]?.name) || m.awayName,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    });
    byVenue.set(m.venue, entry);
  }

  const venues = [...byVenue.values()]
    .map((v) => ({
      ...v,
      matches: v.matches.sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    }))
    .sort((a, b) => b.matches.length - a.matches.length || a.venue.localeCompare(b.venue));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-3xl font-medium tracking-tight">Host venues</h1>
      <p className="mt-3 max-w-2xl text-ink-secondary">
        Every stadium hosting the 2026 World Cup, across the United States,
        Mexico, and Canada, with the fixtures assigned to each.
      </p>

      <section className="mt-10">
        <VenuesBrowser venues={venues} />
      </section>
    </div>
  );
}
