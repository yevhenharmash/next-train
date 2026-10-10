import { describe, expect, it } from "vitest";
import { parseBoard } from "../board";
import { rank } from "../rank";
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

    // "Delayed" with no estimate is judged on the timetable: leave by 08:14, still catchable.
    expect(trains.find((t) => t.id === "LM0819")!.catchable).toBe(true);
    expect(trains.find((t) => t.best)!.id).toBe("LM0819");
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
