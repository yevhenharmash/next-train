import { describe, expect, it } from "vitest";
import { parseBoard } from "../board";
import { delayedBeforeBest, rank } from "../rank";
import { fixtures, nowOf, ukClock } from "./helpers";

function ranked(name: keyof typeof fixtures, walkMinutes: number) {
  const raw = fixtures[name];
  const now = nowOf(raw);
  return rank(parseBoard(raw, "EUS", now).trains, now, walkMinutes);
}

const ids = (trains: { id: string }[]) => trains.map((t) => t.id);

describe("rank", () => {
  it("sorts by arrival at Euston, not departure", () => {
    expect(ids(ranked("evening", 10))).toEqual(["VT1809", "LM1813", "LM1824", "VT1838", "LO1805", "LO1825"]);
  });

  it("sorts a real board by arrival", () => {
    // 20:20, 5 min walk. The 20:30 Overground leaves first but gets in at 21:21, after three LNR trains.
    const trains = ranked("liveEvening", 5);
    expect(trains.map((t) => ukClock(t.arrivesAt))).toEqual([
      "20:52",
      "21:00",
      "21:08",
      "21:21",
      "21:30",
      "21:36",
      "21:38",
      "21:51",
      "22:06",
      "22:21",
    ]);
    expect(trains.find((t) => t.best)!.id).toBe("9657836WATFDJ__");
  });

  it("never picks a train that no longer stops at the destination", () => {
    // The real board's best train (20:32 LNR), but now terminating before Euston.
    const raw = structuredClone(fixtures.liveEvening);
    const service = raw.trainServices!.find((t) => t.serviceID === "9657836WATFDJ__")!;
    const euston = service.subsequentCallingPoints![0].callingPoint.find((p) => p.crs === "EUS")!;
    euston.isCancelled = true;
    euston.et = "Cancelled";

    const now = nowOf(raw);
    const trains = rank(parseBoard(raw, "EUS", now).trains, now, 5);
    const terminated = trains.find((t) => t.id === "9657836WATFDJ__")!;
    expect(terminated.cancelled).toBe(true);
    expect(terminated.departure).toEqual({ kind: "cancelled" });
    expect(terminated.best).toBe(false);
    expect(terminated.reason).toBe("No longer stops at London Euston");
    expect(trains.find((t) => t.best)!.id).toBe("9645110WATFDJ__");
  });

  it("picks the fast train over the stopping one that leaves first", () => {
    // 18:02, no walk: the 18:05 Overground leaves first but arrives 18:56; the 18:09 Avanti arrives 18:25.
    const best = ranked("evening", 0).find((t) => t.best)!;
    expect(best.id).toBe("VT1809");
  });

  it("skips trains you can no longer walk to", () => {
    // 10 min walk at 18:02: the 18:09 Avanti is gone (leave by 17:59); the late 18:13 LNR (now 18:17) is next.
    const trains = ranked("evening", 10);
    expect(trains.find((t) => t.id === "VT1809")!.catchable).toBe(false);
    const best = trains.find((t) => t.best)!;
    expect(best.id).toBe("LM1813");
    expect(ukClock(best.leaveBy)).toBe("18:07");
    expect(best.journeyMinutes).toBe(19);
    expect(trains.filter((t) => t.best)).toHaveLength(1);
  });

  it("never picks a cancelled train, and uses known estimates over the timetable", () => {
    // 08:10, 5 min walk. The 08:14 Avanti is cancelled. The 08:26 LNR leaves before the 08:33 Avanti
    // on paper, but it's running 15 late, so the Avanti gets in first.
    const trains = ranked("disrupted", 5);
    expect(ids(trains)).toEqual(["VT0814", "LM0819", "VT0833", "LM0826", "LO0820"]);

    const cancelled = trains.find((t) => t.id === "VT0814")!;
    expect(cancelled.catchable).toBe(false);
    expect(cancelled.leaveBy).toBeNull();

    // "Delayed" with no estimate is placed and judged on the timetable (leave by 08:14, still
    // catchable), but isn't best: the on-time 08:33 Avanti is. The delayed one is flagged instead.
    const delayed = trains.find((t) => t.id === "LM0819")!;
    expect(delayed.catchable).toBe(true);
    expect(delayed.best).toBe(false);
    expect(trains.find((t) => t.best)!.id).toBe("VT0833");
    expect(delayedBeforeBest(trains)?.id).toBe("LM0819");
  });

  it("flags no delayed train when the best one arrives first", () => {
    expect(delayedBeforeBest(ranked("evening", 10))).toBeNull();
  });

  it("still flags a delayed train when there's no best train", () => {
    // Only the cancelled 08:14 and the delayed 08:19 left: nothing has a known time.
    const raw = fixtures.disrupted;
    const now = nowOf(raw);
    const trains = parseBoard(raw, "EUS", now).trains.filter((t) => t.id === "VT0814" || t.id === "LM0819");
    const result = rank(trains, now, 5);
    expect(result.some((t) => t.best)).toBe(false);
    expect(delayedBeforeBest(result)?.id).toBe("LM0819");
  });

  it("has no best train when nothing is catchable", () => {
    expect(ranked("midnight", 120).some((t) => t.best)).toBe(false);
  });

  it("orders across midnight", () => {
    const trains = ranked("midnight", 3);
    expect(ids(trains)).toEqual(["LM2352", "VT0021", "LO2359"]);
    expect(trains[0].best).toBe(true);
    expect(trains[0].journeyMinutes).toBe(21);
  });
});
