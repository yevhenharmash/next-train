import { Card, CardContent } from "@/components/ui/card";
import type { RankedTrain } from "@/core/types";
import { clockTime, duration, leaveLabel, operatorLabel, platformLabel, runningLabel } from "./format";

type Props = {
  train: RankedTrain | null;
  /** A "Delayed" train with no estimate that might get there sooner than `train`. */
  delayed: RankedTrain | null;
  destination: string;
  now: Date;
};

/** The headline: the best train and when to leave for it. */
export function NextTrain({ train, delayed, destination, now }: Props) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex flex-col gap-1 px-5">
        <p className="text-sm text-muted-foreground">Next to {destination}</p>
        {train ? (
          <>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {clockTime(train.departsAt)}
              <span className="text-muted-foreground"> · </span>
              {platformLabel(train.platform)}
            </p>
            {train.leaveBy && <p className="text-2xl font-medium">{leaveLabel(train.leaveBy, now)}</p>}
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {train.arrivesAt ? `Arrives ${clockTime(train.arrivesAt)}` : "Arrival unknown"} ·{" "}
              {duration(train.journeyMinutes)} · {operatorLabel(train.operatorCode, train.operator)} ·{" "}
              {runningLabel(train.departure)}
            </p>
          </>
        ) : (
          <p className="text-lg font-medium">
            {delayed ? "No train with a confirmed time yet." : "No train you can still catch in the next 2 hours."}
          </p>
        )}
        {delayed?.leaveBy && (
          <p className="mt-2 border-t pt-2 text-sm">
            {clockTime(delayed.scheduledDeparture)} {operatorLabel(delayed.operatorCode, delayed.operator)} is delayed,
            no estimate yet. Leave by {clockTime(delayed.leaveBy)} if you want to try for it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
