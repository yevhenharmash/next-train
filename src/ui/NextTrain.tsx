import { Card, CardContent } from "@/components/ui/card";
import type { RankedTrain } from "@/core/types";
import { clockTime, duration, leaveLabel, operatorLabel, platformLabel, runningLabel } from "./format";

/** The headline: the best train and when to leave for it. */
export function NextTrain({ train, destination, now }: { train: RankedTrain | null; destination: string; now: Date }) {
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
          <p className="text-lg font-medium">No train you can still catch in the next 2 hours.</p>
        )}
      </CardContent>
    </Card>
  );
}
