import { Badge } from "@/components/ui/badge";
import type { RankedTrain } from "@/core/types";
import { cn } from "@/lib/utils";
import { clockTime, duration, operatorLabel, platformLabel, runningLabel } from "./format";

export function TrainRow({ train }: { train: RankedTrain }) {
  const changed = train.expectedDeparture && train.departure.kind === "late";
  return (
    <li className={cn("flex items-start gap-3 py-3", !train.catchable && !train.cancelled && "opacity-50")}>
      <div className="w-14 shrink-0 tabular-nums">
        <p className={cn("text-lg font-semibold", train.cancelled && "line-through")}>{clockTime(train.departsAt)}</p>
        {changed && <p className="text-xs text-muted-foreground line-through">{clockTime(train.scheduledDeparture)}</p>}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-medium">
          {operatorLabel(train.operatorCode, train.operator)}
          {train.best && <Badge>Best</Badge>}
        </p>
        <p className={cn("text-sm text-muted-foreground tabular-nums", train.cancelled && "line-through")}>
          {train.arrivesAt ? `arr ${clockTime(train.arrivesAt)}` : "arr –"} · {duration(train.journeyMinutes)}
          {train.coaches ? ` · ${train.coaches} coaches` : ""}
        </p>
        {!train.catchable && !train.cancelled && <p className="text-xs text-muted-foreground">Too late to walk</p>}
        {train.reason && train.departure.kind !== "on-time" && (
          <p className="mt-0.5 text-xs text-muted-foreground">{train.reason}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-medium tabular-nums">{platformLabel(train.platform)}</p>
        <Badge variant={train.cancelled ? "destructive" : train.departure.kind === "on-time" ? "outline" : "secondary"}>
          {runningLabel(train.departure)}
        </Badge>
      </div>
    </li>
  );
}
