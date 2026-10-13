import { ArrowLeftRight, ChevronDown } from "lucide-react";
import type { Station } from "@/core/types";
import { cn } from "@/lib/utils";

export type RouteEnd = "from" | "to";

type Props = {
  from: Station;
  to: Station;
  onSwap: () => void;
  onPick: (end: RouteEnd) => void;
};

/** A → B. Tap a station to change it, tap the arrows to swap them. */
export function RouteCard({ from, to, onSwap, onPick }: Props) {
  return (
    <section aria-label="Route" className="flex items-stretch gap-1 rounded-[18px] border bg-card p-1.5">
      <StationButton end="from" station={from} onPick={onPick} />
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={`Swap direction: now ${from.name} to ${to.name}`}
          className="flex size-11 items-center justify-center rounded-full border bg-background text-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onSwap}
        >
          <ArrowLeftRight className="size-5" strokeWidth={1.9} />
        </button>
      </div>
      <StationButton end="to" station={to} onPick={onPick} />
    </section>
  );
}

function StationButton({ end, station, onPick }: { end: RouteEnd; station: Station; onPick: Props["onPick"] }) {
  const from = end === "from";
  return (
    <button
      type="button"
      aria-label={`${from ? "From" : "To"} ${station.name}. Change ${from ? "departure" : "destination"} station`}
      className={cn(
        "flex min-h-17 min-w-0 flex-1 basis-0 flex-col justify-center gap-0.5 rounded-xl px-2.5 py-2 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
        from ? "items-start text-left" : "items-end text-right"
      )}
      onClick={() => onPick(end)}
    >
      <span className="flex items-center gap-0.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {from ? "From" : "To"}
        <ChevronDown aria-hidden className="size-3" strokeWidth={2.4} />
      </span>
      <span className="text-[17px] leading-tight font-semibold tracking-[-0.01em]">{station.name}</span>
    </button>
  );
}
