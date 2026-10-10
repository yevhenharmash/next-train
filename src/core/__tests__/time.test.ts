import { describe, expect, it } from "vitest";
import { minutesBetween, parseUkTime } from "../time";

describe("parseUkTime", () => {
  it("reads BST times (UTC+1) in summer", () => {
    const now = new Date("2026-07-01T11:00:00Z"); // 12:00 BST
    expect(parseUkTime("12:30", now)?.toISOString()).toBe("2026-07-01T11:30:00.000Z");
  });

  it("reads GMT times (UTC+0) in winter", () => {
    const now = new Date("2026-12-01T12:00:00Z");
    expect(parseUkTime("12:30", now)?.toISOString()).toBe("2026-12-01T12:30:00.000Z");
  });

  it("rolls a just-after-midnight time over to tomorrow", () => {
    const now = new Date("2026-10-09T22:50:00Z"); // 23:50 BST
    expect(parseUkTime("00:10", now)?.toISOString()).toBe("2026-10-09T23:10:00.000Z");
  });

  it("keeps a late train from before midnight on yesterday", () => {
    const now = new Date("2026-10-09T23:05:00Z"); // 00:05 BST on the 10th
    expect(parseUkTime("23:58", now)?.toISOString()).toBe("2026-10-09T22:58:00.000Z");
  });

  it("keeps the wall-clock time across the end of BST", () => {
    const now = new Date("2026-10-24T22:30:00Z"); // 23:30 BST, Sat; clocks go back at 02:00 BST on Sun
    expect(parseUkTime("08:00", now)?.toISOString()).toBe("2026-10-25T08:00:00.000Z"); // 08:00 GMT
  });

  it("returns null for status words and bad input", () => {
    const now = new Date("2026-10-09T12:00:00Z");
    for (const text of ["On time", "Delayed", "Cancelled", "", "25:00", "9:05"]) {
      expect(parseUkTime(text, now)).toBeNull();
    }
  });
});

describe("minutesBetween", () => {
  it("rounds to whole minutes", () => {
    expect(minutesBetween(new Date("2026-10-09T08:00:00Z"), new Date("2026-10-09T08:16:40Z"))).toBe(17);
  });
});
