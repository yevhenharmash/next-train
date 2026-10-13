import { useEffect, useState } from "react";
import type { Station } from "@/core/types";

export type Settings = {
  from: Station;
  to: Station;
  /** Minutes to walk to a station, kept per station: "Watford Junction" and "Euston" differ. */
  walks: Record<string, number>;
  /** Most recent first, never more than `MAX_RECENT`. */
  recent: Station[];
};

// The app's first name. Kept so renaming it didn't reset anyone's saved settings.
const KEY = "next-train:settings";
export const DEFAULT_WALK = 10;
export const MAX_WALK = 120;
const MAX_RECENT = 5;

export const WATFORD: Station = { crs: "WFJ", name: "Watford Junction" };
export const EUSTON: Station = { crs: "EUS", name: "London Euston" };
const OLD_DESTINATIONS: Record<string, Station> = {
  EUS: EUSTON,
  CLJ: { crs: "CLJ", name: "Clapham Junction" },
};

export const DEFAULTS: Settings = { from: WATFORD, to: EUSTON, walks: {}, recent: [WATFORD, EUSTON] };

const isStation = (value: unknown): value is Station =>
  typeof value === "object" &&
  value !== null &&
  "crs" in value &&
  "name" in value &&
  typeof value.crs === "string" &&
  /^[A-Z]{3}$/.test(value.crs) &&
  typeof value.name === "string" &&
  value.name !== "";

const isWalk = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_WALK;

/** Reads whatever is in localStorage, including the first version's `{ walkMinutes, destination }`. */
export function parseSettings(saved: unknown): Settings {
  if (typeof saved !== "object" || saved === null) return DEFAULTS;
  const raw = saved as Record<string, unknown>;

  let from = isStation(raw.from) ? raw.from : WATFORD;
  let to = isStation(raw.to) ? raw.to : EUSTON;
  const walks: Record<string, number> = {};

  if (typeof raw.destination === "string" && raw.destination in OLD_DESTINATIONS) {
    to = OLD_DESTINATIONS[raw.destination];
  }
  if (isWalk(raw.walkMinutes)) walks[from.crs] = raw.walkMinutes;
  if (typeof raw.walks === "object" && raw.walks !== null) {
    for (const [crs, minutes] of Object.entries(raw.walks)) if (isWalk(minutes)) walks[crs] = minutes;
  }
  if (from.crs === to.crs) [from, to] = [WATFORD, EUSTON];

  const recent = Array.isArray(raw.recent) ? raw.recent.filter(isStation).slice(0, MAX_RECENT) : [from, to];
  return { from, to, walks, recent };
}

export const walkFor = (settings: Settings, crs: string): number => settings.walks[crs] ?? DEFAULT_WALK;

/** The walk to the station you leave from. Clamped to 0–120. */
export function withWalk(settings: Settings, minutes: number): Settings {
  const walk = Math.min(MAX_WALK, Math.max(0, Math.round(minutes)));
  return { ...settings, walks: { ...settings.walks, [settings.from.crs]: walk } };
}

export function swapped(settings: Settings): Settings {
  return { ...settings, from: settings.to, to: settings.from };
}

/** Picks a station for one end. Picking the station at the other end swaps them: it can't be A → A. */
export function withStation(settings: Settings, end: "from" | "to", station: Station): Settings {
  const other = end === "from" ? "to" : "from";
  const next: Settings = {
    ...settings,
    [end]: station,
    ...(settings[other].crs === station.crs ? { [other]: settings[end] } : {}),
    recent: [station, ...settings.recent.filter((s) => s.crs !== station.crs)].slice(0, MAX_RECENT),
  };
  return next;
}

function load(): Settings {
  try {
    return parseSettings(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Private mode or storage disabled: settings just won't persist.
    }
  }, [settings]);
  return [settings, setSettings] as const;
}
