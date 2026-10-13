import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  DEFAULT_WALK,
  EUSTON,
  WATFORD,
  parseSettings,
  swapped,
  walkFor,
  withStation,
  withWalk,
} from "../settings";

const CLAPHAM = { crs: "CLJ", name: "Clapham Junction" };
const BUSHEY = { crs: "BSH", name: "Bushey" };

describe("parseSettings", () => {
  it("falls back to Watford → Euston", () => {
    expect(parseSettings(null)).toEqual(DEFAULTS);
    expect(parseSettings("nonsense")).toEqual(DEFAULTS);
    expect(parseSettings({ from: { crs: "x" }, to: 3 })).toMatchObject({ from: WATFORD, to: EUSTON });
  });

  it("migrates the first version's settings", () => {
    const settings = parseSettings({ walkMinutes: 7, destination: "CLJ" });
    expect(settings).toMatchObject({ from: WATFORD, to: CLAPHAM, walks: { WFJ: 7 } });
  });

  it("keeps a saved route, walks and recent stations", () => {
    const saved = { from: EUSTON, to: WATFORD, walks: { EUS: 6, WFJ: 12 }, recent: [EUSTON, BUSHEY] };
    expect(parseSettings(saved)).toEqual(saved);
  });

  it("drops bad walks and can't start at A → A", () => {
    const settings = parseSettings({ from: BUSHEY, to: BUSHEY, walks: { BSH: -1, WFJ: 99999, EUS: 5 } });
    expect(settings.from).toEqual(WATFORD);
    expect(settings.to).toEqual(EUSTON);
    expect(settings.walks).toEqual({ EUS: 5 });
  });
});

describe("route", () => {
  it("swaps A and B", () => {
    const s = swapped(DEFAULTS);
    expect([s.from, s.to]).toEqual([EUSTON, WATFORD]);
  });

  it("picks a station for one end and remembers it", () => {
    const s = withStation(DEFAULTS, "to", CLAPHAM);
    expect([s.from, s.to]).toEqual([WATFORD, CLAPHAM]);
    expect(s.recent.map((r) => r.crs)).toEqual(["CLJ", "WFJ", "EUS"]);
  });

  it("swaps when you pick the other end's station", () => {
    const s = withStation(DEFAULTS, "from", EUSTON);
    expect([s.from, s.to]).toEqual([EUSTON, WATFORD]);
  });

  it("keeps the recent list short and without repeats", () => {
    const stations = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"].map((crs) => ({ crs, name: crs }));
    const s = [...stations, stations[1]].reduce((acc, st) => withStation(acc, "to", st), DEFAULTS);
    expect(s.recent.map((r) => r.crs)).toEqual(["BBB", "FFF", "EEE", "DDD", "CCC"]);
  });
});

describe("walk time", () => {
  it("is per station, for the one you leave from", () => {
    const s = withWalk(DEFAULTS, 6);
    expect(walkFor(s, "WFJ")).toBe(6);
    expect(walkFor(s, "EUS")).toBe(DEFAULT_WALK);
    // After a swap the walk is the other station's.
    expect(walkFor(withWalk(swapped(s), 3), "EUS")).toBe(3);
    expect(walkFor(swapped(s), "EUS")).toBe(DEFAULT_WALK);
  });

  it("stays between 0 and 120", () => {
    expect(walkFor(withWalk(DEFAULTS, -4), "WFJ")).toBe(0);
    expect(walkFor(withWalk(DEFAULTS, 500), "WFJ")).toBe(120);
  });
});
