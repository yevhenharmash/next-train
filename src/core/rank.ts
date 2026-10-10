import { addMinutes, minutesBetween } from "./time";
import type { RankedTrain, Train } from "./types";

/**
 * Sorts trains by when they get to the destination, not when they leave, and marks the
 * best one: the first catchable train in that order. A stopping train that leaves first
 * can arrive after the next fast one.
 *
 * Nothing is dropped. Cancelled and missed trains stay in the list (the UI strikes them
 * through or greys them out) but are never `best`. A train with an unknown estimate
 * ("Delayed") is judged on its scheduled times.
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

  const best = ranked.find((t) => t.catchable);
  return best ? ranked.map((t) => (t === best ? { ...t, best: true } : t)) : ranked;
}
