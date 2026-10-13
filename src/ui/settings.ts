import { useEffect, useState } from "react";

export const DESTINATIONS = {
  EUS: "London Euston",
  CLJ: "Clapham Junction",
} as const;

export type DestinationCrs = keyof typeof DESTINATIONS;

/** For buttons and headings where the full name doesn't fit. */
export const SHORT_NAMES: Record<DestinationCrs, string> = { EUS: "Euston", CLJ: "Clapham Jn" };

export type Settings = {
  walkMinutes: number;
  destination: DestinationCrs;
};

const KEY = "next-train:settings";
const DEFAULTS: Settings = { walkMinutes: 10, destination: "EUS" };

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
    return {
      walkMinutes:
        typeof saved.walkMinutes === "number" && saved.walkMinutes >= 0 && saved.walkMinutes <= 120
          ? saved.walkMinutes
          : DEFAULTS.walkMinutes,
      destination: saved.destination && saved.destination in DESTINATIONS ? saved.destination : DEFAULTS.destination,
    };
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
