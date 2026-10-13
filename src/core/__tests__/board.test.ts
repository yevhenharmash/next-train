import { describe, expect, it } from "vitest";
import { parseBoard, parseEstimate } from "../board";
import { fixtures, nowOf, ukClock } from "./helpers";

describe("parseEstimate", () => {
  const now = new Date("2026-10-09T07:10:00Z"); // 08:10 BST
  const scheduled = new Date("2026-10-09T07:26:00Z"); // 08:26 BST

  it.each([
    ["On time", { kind: "on-time" }, "08:26"],
    ["08:41", { kind: "late", minutes: 15 }, "08:41"],
    ["08:24", { kind: "late", minutes: -2 }, "08:24"],
    ["08:26", { kind: "on-time" }, "08:26"],
    ["Delayed", { kind: "delayed" }, null],
    ["Cancelled", { kind: "cancelled" }, null],
    ["No report", { kind: "unknown", text: "No report" }, null],
  ])("%s", (estimate, running, expected) => {
    const result = parseEstimate(estimate, scheduled, now);
    expect(result.running).toEqual(running);
    expect(ukClock(result.expected)).toBe(expected);
  });
});

describe("parseBoard", () => {
  it("parses a normal evening board", () => {
    const board = parseBoard(fixtures.evening, "EUS", nowOf(fixtures.evening));
    expect(board.station).toBe("Watford Junction");
    expect(board.destination).toBe("London Euston");
    expect(board.alerts).toEqual([]);
    expect(board.trains).toHaveLength(6);

    const lnr = board.trains.find((t) => t.id === "LM1813")!;
    expect(lnr.operator).toBe("London Northwestern Railway");
    expect(lnr.platform).toBe("9");
    expect(lnr.coaches).toBe(8);
    expect(lnr.departure).toEqual({ kind: "late", minutes: 4 });
    expect(ukClock(lnr.scheduledDeparture)).toBe("18:13");
    expect(ukClock(lnr.expectedDeparture)).toBe("18:17");
    expect(ukClock(lnr.scheduledArrival)).toBe("18:33");
    expect(ukClock(lnr.expectedArrival)).toBe("18:36");
    expect(lnr.reason).toMatch(/freight/);
  });

  it("finds the destination among intermediate calling points", () => {
    const board = parseBoard(fixtures.evening, "EUS", nowOf(fixtures.evening));
    const overground = board.trains.find((t) => t.id === "LO1805")!;
    expect(ukClock(overground.expectedArrival)).toBe("18:56");
  });

  it("uses null for a platform that isn't announced yet", () => {
    const board = parseBoard(fixtures.evening, "EUS", nowOf(fixtures.evening));
    expect(board.trains.find((t) => t.id === "LM1824")!.platform).toBeNull();
  });

  it("has no arrival for a destination the train doesn't call at", () => {
    const board = parseBoard(fixtures.evening, "CLJ", nowOf(fixtures.evening));
    expect(board.trains.every((t) => t.scheduledArrival === null && t.expectedArrival === null)).toBe(true);
  });

  it("handles cancellations, unknown delays and alerts", () => {
    const board = parseBoard(fixtures.disrupted, "EUS", nowOf(fixtures.disrupted));
    expect(board.alerts).toEqual([
      "Disruption between Watford Junction and London Euston. More details can be found in Latest Travel News.",
    ]);

    const cancelled = board.trains.find((t) => t.id === "VT0814")!;
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.departure).toEqual({ kind: "cancelled" });
    expect(cancelled.expectedDeparture).toBeNull();
    expect(cancelled.expectedArrival).toBeNull();
    expect(ukClock(cancelled.scheduledArrival)).toBe("08:30");
    expect(cancelled.reason).toMatch(/fault on this train/);

    const delayed = board.trains.find((t) => t.id === "LM0819")!;
    expect(delayed.cancelled).toBe(false);
    expect(delayed.departure).toEqual({ kind: "delayed" });
    expect(delayed.expectedDeparture).toBeNull();
    expect(delayed.expectedArrival).toBeNull();
    expect(delayed.reason).toMatch(/signalling/);
  });

  it("puts times after midnight on the next day", () => {
    const board = parseBoard(fixtures.midnight, "EUS", nowOf(fixtures.midnight));
    const lnr = board.trains.find((t) => t.id === "LM2352")!;
    expect(lnr.scheduledDeparture.toISOString()).toBe("2026-10-09T22:52:00.000Z");
    expect(lnr.expectedArrival?.toISOString()).toBe("2026-10-09T23:13:00.000Z"); // 00:13 BST on the 10th

    const overground = board.trains.find((t) => t.id === "LO2359")!;
    expect(overground.departure).toEqual({ kind: "late", minutes: 4 });
    expect(overground.expectedDeparture?.toISOString()).toBe("2026-10-09T23:03:00.000Z");
  });

  it("copes with an empty board", () => {
    const board = parseBoard({ ...fixtures.evening, trainServices: null }, "EUS", nowOf(fixtures.evening));
    expect(board.trains).toEqual([]);
  });

  it("turns a real NRCC alert into plain text (Tue 2026-10-13 22:08)", () => {
    // The real shape: [{ Value: "...&nbsp;... <a href=...>National Rail website</a>." }]
    const board = parseBoard(fixtures.liveAlert, "EUS", nowOf(fixtures.liveAlert));
    expect(board.alerts).toEqual([
      "London Overground trains between Watford Junction and London Euston may be revised. Latest information can be found in the Disruptions area of the National Rail website.",
    ]);
  });

  it("parses a real cancellation (Tue 2026-10-13 21:49)", () => {
    const board = parseBoard(fixtures.liveCancelled, "EUS", nowOf(fixtures.liveCancelled));
    // nrccMessages is null here (absent on the other real board): both mean no alerts.
    expect(board.alerts).toEqual([]);

    // The train is cancelled, but its Euston stop still says "On time": the train's flag wins.
    const cancelled = board.trains.find((t) => t.id === "9662785WATFJDC_")!;
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.departure).toEqual({ kind: "cancelled" });
    expect(cancelled.expectedArrival).toBeNull();
    expect(ukClock(cancelled.scheduledArrival)).toBe("22:53");
    expect(cancelled.reason).toBe("This service has been cancelled because of trespassers on the railway");

    const late = board.trains.find((t) => t.id === "9671965WATFDJ__")!;
    expect(late.departure).toEqual({ kind: "late", minutes: 11 });
    expect(ukClock(late.expectedArrival)).toBe("22:41");
  });

  it("parses a real RDM board (Tue 2026-10-13 20:20)", () => {
    const board = parseBoard(fixtures.liveEvening, "EUS", nowOf(fixtures.liveEvening));
    expect(board.station).toBe("Watford Junction");
    expect(board.destination).toBe("London Euston");
    // No nrccMessages key at all when there are no alerts.
    expect(board.alerts).toEqual([]);
    expect(board.trains).toHaveLength(10);
    expect(board.trains.every((t) => t.scheduledArrival !== null)).toBe(true);

    const late = board.trains.find((t) => t.id === "9645110WATFDJ__")!;
    expect(late.operator).toBe("LNR & WMR");
    expect(late.operatorCode).toBe("LM");
    expect(late.platform).toBe("7");
    // length is 0 (unknown) on every service here.
    expect(late.coaches).toBeNull();
    expect(late.departure).toEqual({ kind: "late", minutes: 12 });
    expect(ukClock(late.expectedDeparture)).toBe("20:45");
    expect(ukClock(late.scheduledArrival)).toBe("20:50");
    expect(ukClock(late.expectedArrival)).toBe("21:00");
  });
});

describe("alert text", () => {
  it("keeps spaces before file-like words such as .env", () => {
    const raw = { ...fixtures.evening, nrccMessages: [{ Value: "Set RDM_KEY in .env to see <b>live</b> trains ." }] };
    expect(parseBoard(raw, "EUS", nowOf(raw)).alerts).toEqual(["Set RDM_KEY in .env to see live trains."]);
  });
});
