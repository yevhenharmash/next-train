import disrupted from "./fixtures/disrupted.json";
import evening from "./fixtures/evening.json";
import liveCancelled from "./fixtures/live-cancelled.json";
import liveEvening from "./fixtures/live-evening.json";
import midnight from "./fixtures/midnight.json";
import type { RawBoard } from "../types";

export const fixtures = {
  evening: evening as RawBoard,
  disrupted: disrupted as RawBoard,
  midnight: midnight as RawBoard,
  liveEvening: liveEvening as RawBoard,
  liveCancelled: liveCancelled as RawBoard,
};

/** The moment each fixture was generated, i.e. the `now` its times are relative to. */
export const nowOf = (raw: RawBoard) => new Date(raw.generatedAt);

/** "HH:MM" in UK time, for readable assertions. */
export const ukClock = (date: Date | null) =>
  date === null
    ? null
    : new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }).format(date);
