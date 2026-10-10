// Dev-only demo board, used by the dev proxy when RDM_KEY isn't set. Never deployed.
// It mimics the WFJ → EUS timetable around the current time so the UI can be worked on without a key.

import type { RawBoard, RawService } from "../src/core/types.ts";

type Pattern = {
  minute: number;
  operatorCode: string;
  operator: string;
  journey: number;
  platform: string;
  length: number;
};

// Roughly the off-peak hourly pattern from Watford Junction to Euston.
const HOURLY: Pattern[] = [
  { minute: 5, operatorCode: "LO", operator: "London Overground", journey: 51, platform: "2", length: 5 },
  { minute: 9, operatorCode: "VT", operator: "Avanti West Coast", journey: 16, platform: "8", length: 11 },
  { minute: 13, operatorCode: "LM", operator: "London Northwestern Railway", journey: 20, platform: "9", length: 8 },
  { minute: 24, operatorCode: "LM", operator: "London Northwestern Railway", journey: 22, platform: "10", length: 12 },
  { minute: 25, operatorCode: "LO", operator: "London Overground", journey: 51, platform: "2", length: 5 },
  { minute: 38, operatorCode: "VT", operator: "Avanti West Coast", journey: 16, platform: "8", length: 9 },
  { minute: 43, operatorCode: "LM", operator: "London Northwestern Railway", journey: 20, platform: "9", length: 8 },
  { minute: 45, operatorCode: "LO", operator: "London Overground", journey: 51, platform: "2", length: 5 },
];

const ukClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const hhmm = (date: Date) => ukClock.format(date);
const plus = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

export function demoBoard(now: Date): RawBoard {
  const hourStart = new Date(now);
  hourStart.setUTCMinutes(0, 0, 0); // UK offsets are whole hours, so this is also the UK hour start

  const departures = [-1, 0, 1, 2].flatMap((h) =>
    HOURLY.map((p) => ({ pattern: p, std: plus(hourStart, h * 60 + p.minute) }))
  );
  const upcoming = departures
    .filter(({ std }) => std.getTime() > now.getTime() - 2 * 60_000 && std.getTime() < now.getTime() + 90 * 60_000)
    .slice(0, 10);

  const trainServices = upcoming.map(({ pattern, std }, index): RawService => {
    // A little disruption so every state is visible: the 2nd train is 4 late, the 3rd is delayed
    // with no estimate, the 5th is cancelled.
    const late = index === 1 ? 4 : 0;
    const noEstimate = index === 2;
    const cancelled = index === 4;
    const arrival = plus(std, pattern.journey);
    return {
      serviceID: `demo-${pattern.operatorCode}-${hhmm(std)}`,
      std: hhmm(std),
      etd: cancelled ? "Cancelled" : noEstimate ? "Delayed" : late ? hhmm(plus(std, late)) : "On time",
      platform: index === 3 ? null : pattern.platform,
      operator: pattern.operator,
      operatorCode: pattern.operatorCode,
      isCancelled: cancelled,
      cancelReason: cancelled ? "This train has been cancelled because of a shortage of train crew" : null,
      delayReason: late
        ? "This train has been delayed by a late running train in front of this one"
        : noEstimate
          ? "This train has been delayed by a signalling problem"
          : null,
      length: pattern.length,
      destination: [{ locationName: "London Euston", crs: "EUS" }],
      subsequentCallingPoints: [
        {
          callingPoint: [
            {
              locationName: "London Euston",
              crs: "EUS",
              st: hhmm(arrival),
              et: cancelled ? "Cancelled" : noEstimate ? "Delayed" : late ? hhmm(plus(arrival, late)) : "On time",
              isCancelled: cancelled,
            },
          ],
        },
      ],
    };
  });

  return {
    generatedAt: now.toISOString(),
    locationName: "Watford Junction",
    crs: "WFJ",
    filterLocationName: "London Euston",
    filtercrs: "EUS",
    nrccMessages: [{ Value: "Demo data: set RDM_KEY in .env to see live trains." }],
    platformAvailable: true,
    trainServices,
  };
}
