import { describe, expect, it } from "vitest";
import { clockTime, duration, fromNow, leaveLabel, platformLabel, runningLabel } from "../format";

const now = new Date("2026-10-08T17:02:00Z"); // 18:02 BST
const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

describe("format", () => {
  it("shows UK clock time regardless of the machine timezone", () => {
    expect(clockTime(now)).toBe("18:02");
    expect(clockTime(new Date("2026-12-01T09:05:00Z"))).toBe("09:05");
  });

  it("counts down", () => {
    expect(fromNow(at(-1), now)).toBe("now");
    expect(fromNow(at(4), now)).toBe("in 4 min");
    expect(fromNow(at(65), now)).toBe("in 1 h 5 min");
    expect(fromNow(at(120), now)).toBe("in 2 h");
  });

  it("tells you when to leave", () => {
    expect(leaveLabel(at(0), now)).toBe("Leave now");
    expect(leaveLabel(at(7), now)).toBe("Leave in 7 min");
    expect(leaveLabel(at(63), now)).toBe("Leave at 19:05");
  });

  it("labels platforms, journeys and status", () => {
    expect(platformLabel("8")).toBe("Plat 8");
    expect(platformLabel(null)).toBe("Plat –");
    expect(duration(16)).toBe("16 min");
    expect(duration(75)).toBe("1 h 15");
    expect(duration(null)).toBe("–");
    expect(runningLabel({ kind: "late", minutes: 4 })).toBe("4 min late");
    expect(runningLabel({ kind: "late", minutes: -2 })).toBe("2 min early");
    expect(runningLabel({ kind: "delayed" })).toBe("Delayed");
  });
});
