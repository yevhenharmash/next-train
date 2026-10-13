import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { minutesBetween, UK_TIME_ZONE } from "@/core/time";
import type { RankedTrain, Running } from "@/core/types";

const uk = tz(UK_TIME_ZONE);

/** "18:47" in UK time, whatever the device's timezone. */
export function clockTime(date: Date): string {
  return format(date, "HH:mm", { in: uk });
}

/** "now", "in 4 min", "in 1 h 5 min". */
export function fromNow(date: Date, now: Date): string {
  const minutes = minutesBetween(now, date);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const rest = minutes % 60;
  return `in ${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ""}`;
}

/** The call to action for the best train: "Leave now" / "Leave in 4 min" / "Leave at 19:05". */
export function leaveLabel(leaveBy: Date, now: Date): string {
  const minutes = minutesBetween(now, leaveBy);
  if (minutes <= 0) return "Leave now";
  if (minutes < 60) return `Leave in ${minutes} min`;
  return `Leave at ${clockTime(leaveBy)}`;
}

/** Under the headline: "Leave by 18:44 · 8 min walk". */
export function leaveHint(leaveBy: Date, walkMinutes: number): string {
  return `Leave by ${clockTime(leaveBy)} · ${walkMinutes} min walk`;
}

/**
 * The second line of a row, after the operator: "20 min · leave 18:44". Empty for a cancelled train.
 * Only what the board actually gave us.
 */
export function rowDetails(train: RankedTrain): string {
  if (train.cancelled) return "";
  if (train.journeyMinutes === null) return "arrival unknown";
  const leave = train.catchable && train.leaveBy ? `leave ${clockTime(train.leaveBy)}` : "too late to walk";
  return `${duration(train.journeyMinutes)} · ${leave}`;
}

/** Under the headline's times, after the operator: "20 min", plus coaches when the board knows them (it usually doesn't). */
export function trainDetails(train: RankedTrain): string {
  return [duration(train.journeyMinutes), train.coaches ? `${train.coaches} coaches` : null]
    .filter(Boolean)
    .join(" · ");
}

export function platformLabel(platform: string | null): string {
  return platform ? `Plat ${platform}` : "Plat –";
}

export function duration(minutes: number | null): string {
  if (minutes === null) return "–";
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest}` : ""}`;
}

/** Status in words, never colour alone. */
export function runningLabel(running: Running): string {
  switch (running.kind) {
    case "on-time":
      return "On time";
    case "late":
      return running.minutes > 0 ? `${running.minutes} min late` : `${-running.minutes} min early`;
    case "delayed":
      return "Delayed";
    case "cancelled":
      return "Cancelled";
    case "unknown":
      return running.text;
  }
}

// Keyed by Darwin operator code: the board's own names aren't much help ("LNR & WMR").
const OPERATORS: Record<string, string> = {
  VT: "Avanti West Coast",
  LM: "London Northwestern Railway",
  LO: "London Overground",
  SN: "Southern",
};

export function operatorLabel(code: string, name: string): string {
  return OPERATORS[code] ?? name;
}
