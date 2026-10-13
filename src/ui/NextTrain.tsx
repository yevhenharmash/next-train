import type { RankedTrain } from "@/core/types";
import { clockTime, leaveHint, leaveLabel, operatorLabel, trainDetails } from "./format";
import { Status } from "./Status";

type Props = {
  train: RankedTrain | null;
  /** A "Delayed" train with no estimate that might get there sooner than `train`. */
  delayed: RankedTrain | null;
  /** Short destination name, e.g. "Euston". */
  destination: string;
  walkMinutes: number;
  now: Date;
};

/** The headline: the best train and when to leave for it. A dark card in both themes. */
export function NextTrain({ train, delayed, destination, walkMinutes, now }: Props) {
  return (
    <section
      aria-label="Next train"
      className="flex flex-col gap-3.5 rounded-[20px] bg-hero px-5 pt-4.5 pb-5 text-hero-foreground"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.08em] text-hero-muted uppercase">Next to {destination}</span>
        {train && <Status running={train.departure} onHero />}
      </div>

      {train ? (
        <>
          {train.leaveBy && (
            <div className="flex flex-col gap-1.5 tabular-nums">
              <p className="text-[44px] leading-none font-bold tracking-[-0.035em] text-amber">
                {leaveLabel(train.leaveBy, now)}
              </p>
              <p className="text-sm text-hero-muted">{leaveHint(train.leaveBy, walkMinutes)}</p>
            </div>
          )}
          <dl className="grid grid-cols-3 gap-2 border-t border-hero-line pt-3.5 tabular-nums">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-hero-muted">Departs</dt>
              <dd className="text-2xl font-semibold tracking-tight">{clockTime(train.departsAt)}</dd>
              {train.departure.kind === "late" && (
                <dd className="text-xs text-hero-muted line-through">{clockTime(train.scheduledDeparture)}</dd>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-hero-muted">Platform</dt>
              <dd className="text-2xl font-semibold tracking-tight">{train.platform ?? "–"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-hero-muted">Arrives</dt>
              <dd className="text-2xl font-semibold tracking-tight">
                {train.arrivesAt ? clockTime(train.arrivesAt) : "–"}
              </dd>
            </div>
          </dl>
          <p className="text-[13px] text-hero-muted tabular-nums">
            {operatorLabel(train.operatorCode, train.operator)} · {trainDetails(train)}
          </p>
        </>
      ) : (
        <p className="text-xl leading-tight font-semibold">
          {delayed ? "No train with a confirmed time yet." : "No train you can still catch in the next 2 hours."}
        </p>
      )}

      {delayed?.leaveBy && (
        <p className="border-t border-hero-line pt-3 text-[13px] tabular-nums">
          {clockTime(delayed.scheduledDeparture)} {operatorLabel(delayed.operatorCode, delayed.operator)} is delayed, no
          estimate yet. Leave by {clockTime(delayed.leaveBy)} if you want to try for it.
        </p>
      )}
    </section>
  );
}
