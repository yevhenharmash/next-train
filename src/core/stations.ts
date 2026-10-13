import type { Station } from "./types";

/** `[crs, name]`, the shape of `src/data/stations.json`. */
export type StationRow = readonly [crs: string, name: string];

export const toStation = ([crs, name]: StationRow): Station => ({ crs, name });

// London terminals, where "London" adds nothing. Not London Bridge, London Fields or London Road
// (Brighton): there "London" is part of the name.
const LONDON_TERMINALS = new Set([
  "Blackfriars",
  "Cannon Street",
  "Charing Cross",
  "Euston",
  "Fenchurch Street",
  "Kings Cross",
  "Liverpool Street",
  "Marylebone",
  "Paddington",
  "St Pancras International",
  "Victoria",
  "Waterloo",
  "Waterloo East",
]);

/** "London Euston" → "Euston", for headings where the full name is a mouthful. */
export function shortName(name: string): string {
  const rest = name.replace(/^London /, "");
  return LONDON_TERMINALS.has(rest) ? rest : name;
}

const plain = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// "and" is noise: "harrow wealdstone" finds "Harrow & Wealdstone" ("&" goes with the punctuation).
const normalise = (text: string) =>
  plain(text)
    .replace(/\band\b/g, " ")
    .replace(/ +/g, " ")
    .trim();

/**
 * Finds stations by name or code. Best matches first: the exact code, then names that start
 * with the query, then names with a word that does, then names that contain it. Within a group
 * the list's own order (A–Z) is kept. An empty query finds nothing.
 */
export function searchStations(rows: readonly StationRow[], query: string, limit = 50): Station[] {
  // Unless "and" is all there is so far: typing "And" is on the way to "Andover".
  const q = normalise(query) || plain(query);
  if (q === "") return [];
  const groups: StationRow[][] = [[], [], [], []];
  for (const row of rows) {
    const name = normalise(row[1]);
    if (row[0].toLowerCase() === q) groups[0].push(row);
    else if (name.startsWith(q)) groups[1].push(row);
    else if (name.split(" ").some((word) => word.startsWith(q))) groups[2].push(row);
    else if (name.includes(q)) groups[3].push(row);
  }
  return groups.flat().slice(0, limit).map(toStation);
}
