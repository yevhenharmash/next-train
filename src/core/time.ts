import { TZDate } from "@date-fns/tz";

/** Darwin times are UK local wall-clock times. Never use the machine's timezone. */
export const UK_TIME_ZONE = "Europe/London";

const HOUR_MS = 60 * 60 * 1000;
const HH_MM = /^(\d{2}):(\d{2})$/;

/**
 * Turns a UK-local "HH:MM" from Darwin (no date attached) into a Date close to `now`.
 * A board shows roughly the next 2 hours, plus trains running late, so the time is
 * taken to be between 6h before and 18h after `now`. That handles midnight both ways:
 * at 23:50 "00:10" is tomorrow, and at 00:05 "23:58" is a late train from yesterday.
 * Returns null for anything that isn't "HH:MM" ("On time", "Delayed", …).
 */
export function parseUkTime(hhmm: string, now: Date): Date | null {
  const match = HH_MM.exec(hhmm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const ukNow = new TZDate(now.getTime(), UK_TIME_ZONE);
  const candidate = new TZDate(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate(), hours, minutes, UK_TIME_ZONE);
  const diff = candidate.getTime() - now.getTime();
  // Shift by calendar day in UK time, so a DST change in between keeps the wall-clock time.
  if (diff < -6 * HOUR_MS) candidate.setDate(candidate.getDate() + 1);
  else if (diff > 18 * HOUR_MS) candidate.setDate(candidate.getDate() - 1);
  return new Date(candidate.getTime());
}

export function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
