// Raw RDM "Live Departure Board" (LDBWS) response, GetDepBoardWithDetails.
// Field names checked against a real response on 2026-10-13 (fixtures/live-evening.json), except
// the nrccMessages item shape. Everything optional that the API may omit is optional here.

export type RawLocation = {
  locationName: string;
  crs: string;
  via?: string | null;
};

export type RawCallingPoint = {
  locationName: string;
  crs: string;
  /** Scheduled time, "HH:MM" UK local. */
  st: string;
  /** Estimated: "On time" | "Delayed" | "Cancelled" | "HH:MM". Absent once the train has called. */
  et?: string | null;
  /** Actual: same shapes as `et`, present once the train has called. */
  at?: string | null;
  isCancelled?: boolean;
};

export type RawService = {
  serviceID: string;
  /** Scheduled departure, "HH:MM" UK local. */
  std: string;
  /** "On time" | "Delayed" | "Cancelled" | "HH:MM". */
  etd: string;
  platform?: string | null;
  operator: string;
  operatorCode: string;
  isCancelled?: boolean;
  cancelReason?: string | null;
  delayReason?: string | null;
  length?: number | null;
  destination: RawLocation[];
  subsequentCallingPoints?: { callingPoint: RawCallingPoint[] }[] | null;
};

export type RawBoard = {
  generatedAt: string;
  locationName: string;
  crs: string;
  filterLocationName?: string | null;
  filtercrs?: string | null;
  nrccMessages?: { Value: string }[] | null;
  platformAvailable?: boolean;
  trainServices?: RawService[] | null;
};

/** How a departure (or arrival) is running compared with the timetable. */
export type Running =
  | { kind: "on-time" }
  /** `minutes` > 0 is late, < 0 is early. */
  | { kind: "late"; minutes: number }
  /** Delayed with no estimate. */
  | { kind: "delayed" }
  | { kind: "cancelled" }
  /** A status string we don't recognise; shown as-is. */
  | { kind: "unknown"; text: string };

export type Train = {
  id: string;
  operator: string;
  operatorCode: string;
  /** null until the platform is announced. */
  platform: string | null;
  destination: string;
  coaches: number | null;
  cancelled: boolean;
  /** Cancel reason for cancelled trains, otherwise the delay reason, if any. */
  reason: string | null;
  scheduledDeparture: Date;
  /** null when the estimate is unknown ("Delayed") or the train is cancelled. */
  expectedDeparture: Date | null;
  departure: Running;
  /** null when the train doesn't call at the chosen destination. */
  scheduledArrival: Date | null;
  expectedArrival: Date | null;
};

export type Board = {
  generatedAt: Date;
  station: string;
  destination: string | null;
  alerts: string[];
  trains: Train[];
};

export type RankedTrain = Train & {
  /** Expected departure, or scheduled when the estimate is unknown. */
  departsAt: Date;
  /** Expected arrival, or scheduled; null when unknown. Used for sorting. */
  arrivesAt: Date | null;
  journeyMinutes: number | null;
  /** When to leave home; null for cancelled trains. */
  leaveBy: Date | null;
  /** Not cancelled, and there's still time to walk to the station. */
  catchable: boolean;
  /** The catchable train that gets to the destination first. */
  best: boolean;
};
