import type { RankedTrain } from "@/core/types";
import { cn } from "@/lib/utils";
import { clockTime, operatorLabel, platformLabel, rowDetails } from "./format";
import { Status } from "./Status";

export function TrainRow({ train }: { train: RankedTrain }) {
  const operator = operatorLabel(train.operatorCode, train.operator);
  const missed = !train.catchable && !train.cancelled;
  return (
    <li
      className={cn(
        "flex items-start gap-3 px-3.5 py-3",
        train.best && "bg-best-bg",
        // Muted colour, not opacity: opacity would take the text below 4.5:1 contrast.
        missed && "text-muted-foreground"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-baseline gap-1.5 text-[17px] font-semibold tabular-nums">
          <span className={cn(train.cancelled && "line-through")}>{clockTime(train.departsAt)}</span>
          {train.departure.kind === "late" && (
            <span className="text-xs font-normal text-muted-foreground line-through">
              {clockTime(train.scheduledDeparture)}
            </span>
          )}
          <span aria-hidden className="font-normal text-muted-foreground">
            →
          </span>
          <span className="sr-only">arrives</span>
          <span className={cn(train.cancelled && "line-through")}>
            {train.arrivesAt ? clockTime(train.arrivesAt) : "–"}
          </span>
          {train.best && (
            <span className="self-center rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] text-[#101317] uppercase">
              Best
            </span>
          )}
        </p>
        <p className="text-[13px] text-muted-foreground tabular-nums">
          {/* Long names ("London Northwestern Railway") get smaller type so the row stays compact. */}
          <span className={cn(operator.length > 12 && "text-xs")}>{operator}</span>
          {rowDetails(train) && (
            <>
              {" · "}
              <span className="whitespace-nowrap">{rowDetails(train)}</span>
            </>
          )}
        </p>
        {train.reason && train.departure.kind !== "on-time" && (
          <p className="text-xs text-muted-foreground">{train.reason}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[13px] font-semibold tabular-nums">{platformLabel(train.platform)}</span>
        <Status running={train.departure} />
      </div>
    </li>
  );
}
