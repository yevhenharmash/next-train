import { addMinutes, minutesBetween } from "./time";
import type { RankedTrain, Train } from "./types";

/**
 * Sorts trains by when they get to the destination, not when they leave, and marks the
 * best one: the first catchable train in that order with a known departure time. A stopping
 * train that leaves first can arrive after the next fast one.
 *
 * Nothing is dropped. Cancelled and missed trains stay in the list (the UI strikes them
 * through or greys them out) but are never `best`. A train with no estimate ("Delayed") is
 * placed by its timetable times, like station boards do, but is never `best`: the headline
 * shouldn't send you out of the door on a guess. See `delayedBeforeBest`.
 */
export function rank(trains: Train[], now: Date, walkMinutes: number): RankedTrain[] {
  const ranked = trains.map((train): RankedTrain => {
    const departsAt = train.expectedDeparture ?? train.scheduledDeparture;
    const arrivesAt = train.expectedArrival ?? train.scheduledArrival;
    const leaveBy = train.cancelled ? null : addMinutes(departsAt, -walkMinutes);
    return {
      ...train,
      departsAt,
      arrivesAt,
      journeyMinutes: arrivesAt ? minutesBetween(departsAt, arrivesAt) : null,
      leaveBy,
      catchable: leaveBy !== null && leaveBy.getTime() >= now.getTime(),
      best: false,
    };
  });

  ranked.sort((a, b) => {
    // Trains with no known arrival go last.
    const byArrival = (a.arrivesAt?.getTime() ?? Infinity) - (b.arrivesAt?.getTime() ?? Infinity);
    return byArrival !== 0 && !Number.isNaN(byArrival) ? byArrival : a.departsAt.getTime() - b.departsAt.getTime();
  });

  const best = ranked.find((t) => t.catchable && hasKnownTime(t));
  return best ? ranked.map((t) => (t === best ? { ...t, best: true } : t)) : ranked;
}

const hasKnownTime = (train: RankedTrain) => train.expectedDeparture !== null;

/**
 * A catchable train with no estimate that might get you there sooner than the best one
 * (it's ahead of it in arrival order), so the UI can mention it under the headline.
 */
export function delayedBeforeBest(ranked: RankedTrain[]): RankedTrain | null {
  const bestIndex = ranked.findIndex((t) => t.best);
  const ahead = bestIndex === -1 ? ranked : ranked.slice(0, bestIndex);
  return ahead.find((t) => t.catchable && !hasKnownTime(t)) ?? null;
}
