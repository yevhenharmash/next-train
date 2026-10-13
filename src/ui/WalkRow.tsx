import { Minus, Plus } from "lucide-react";
import { MAX_WALK } from "./settings";

type Props = {
  /** The station you walk to: where the trip starts. */
  station: string;
  minutes: number;
  onChange: (minutes: number) => void;
};

const stepButton =
  "flex size-11 items-center justify-center text-foreground hover:bg-accent disabled:text-muted-foreground disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none";

export function WalkRow({ station, minutes, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <p className="min-w-0 text-sm text-muted-foreground">
        Walk to <strong className="font-semibold text-foreground">{station}</strong>
      </p>
      <div
        role="group"
        aria-label="Walk to the station"
        className="flex shrink-0 items-center overflow-hidden rounded-xl border bg-card"
      >
        <button
          type="button"
          aria-label="Shorter walk"
          className={stepButton}
          disabled={minutes <= 0}
          onClick={() => onChange(minutes - 1)}
        >
          <Minus className="size-4.5" />
        </button>
        <span className="w-14.5 text-center text-[15px] font-semibold tabular-nums">{minutes} min</span>
        <button
          type="button"
          aria-label="Longer walk"
          className={stepButton}
          disabled={minutes >= MAX_WALK}
          onClick={() => onChange(minutes + 1)}
        >
          <Plus className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
