import { minutesBetween, parseUkTime } from "./time";
import type { Board, RawBoard, RawCallingPoint, RawService, Running, Train } from "./types";

/**
 * Reads a Darwin estimate ("On time" | "Delayed" | "Cancelled" | "HH:MM") against the
 * scheduled time. `expected` is null when there's no usable time.
 */
export function parseEstimate(
  estimate: string | null | undefined,
  scheduled: Date,
  now: Date
): { expected: Date | null; running: Running } {
  const text = estimate?.trim() ?? "";
  if (text === "" || text === "On time") return { expected: scheduled, running: { kind: "on-time" } };
  if (text === "Cancelled") return { expected: null, running: { kind: "cancelled" } };
  if (text === "Delayed") return { expected: null, running: { kind: "delayed" } };

  const expected = parseUkTime(text, now);
  if (!expected) return { expected: null, running: { kind: "unknown", text } };
  const minutes = minutesBetween(scheduled, expected);
  return { expected, running: minutes === 0 ? { kind: "on-time" } : { kind: "late", minutes } };
}

function findCallingPoint(service: RawService, crs: string): RawCallingPoint | undefined {
  // A train that splits has several calling point lists; the destination is in one of them.
  return (service.subsequentCallingPoints ?? []).flatMap((list) => list.callingPoint ?? []).find((p) => p.crs === crs);
}

/** Darwin NRCC messages can contain HTML (links, <p>); we only show text. */
function messageText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])(?=\s|$)/g, "$1")
    .trim();
}

function toTrain(service: RawService, destinationCrs: string, now: Date): Train | null {
  const scheduledDeparture = parseUkTime(service.std, now);
  if (!scheduledDeparture) return null;

  const departure = parseEstimate(service.etd, scheduledDeparture, now);
  const stop = findCallingPoint(service, destinationCrs);
  // A train that still runs but no longer calls at the destination (say it now terminates early)
  // is cancelled as far as this trip goes: it must never be the one we tell you to catch.
  const stopCancelled = stop !== undefined && (stop.isCancelled === true || stop.et?.trim() === "Cancelled");
  const cancelled = service.isCancelled === true || departure.running.kind === "cancelled" || stopCancelled;

  const scheduledArrival = stop ? parseUkTime(stop.st, now) : null;
  const arrival =
    stop && scheduledArrival && !stopCancelled ? parseEstimate(stop.et ?? stop.at, scheduledArrival, now) : null;

  return {
    id: service.serviceID,
    operator: service.operator,
    operatorCode: service.operatorCode,
    platform: service.platform?.trim() || null,
    destination: service.destination.map((d) => d.locationName).join(" & "),
    coaches: service.length || null,
    cancelled,
    reason: cancelled
      ? (service.cancelReason ?? (stopCancelled ? `No longer stops at ${stop.locationName}` : null))
      : (service.delayReason ?? null),
    scheduledDeparture,
    expectedDeparture: cancelled ? null : departure.expected,
    departure: cancelled ? { kind: "cancelled" } : departure.running,
    scheduledArrival,
    expectedArrival: cancelled ? null : (arrival?.expected ?? null),
  };
}

/** Raw RDM board → our Board, with arrival times at `destinationCrs`. */
export function parseBoard(raw: RawBoard, destinationCrs: string, now: Date): Board {
  return {
    generatedAt: new Date(raw.generatedAt),
    station: raw.locationName,
    destination: raw.filterLocationName ?? null,
    alerts: (raw.nrccMessages ?? []).map((m) => messageText(m.Value)).filter((text) => text !== ""),
    trains: (raw.trainServices ?? []).flatMap((s) => toTrain(s, destinationCrs, now) ?? []),
  };
}
