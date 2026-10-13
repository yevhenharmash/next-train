import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DESTINATIONS, SHORT_NAMES, type DestinationCrs, type Settings } from "./settings";

type Props = { settings: Settings; onChange: (settings: Settings) => void };

const stepButton =
  "flex size-11 items-center justify-center text-foreground hover:bg-accent disabled:text-muted-foreground disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none";

export function SettingsBar({ settings, onChange }: Props) {
  const setWalk = (walkMinutes: number) =>
    onChange({ ...settings, walkMinutes: Math.min(120, Math.max(0, walkMinutes)) });
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div
        role="group"
        aria-label="Walk to the station"
        className="flex items-center overflow-hidden rounded-xl border bg-card"
      >
        <button
          type="button"
          aria-label="Shorter walk"
          className={stepButton}
          disabled={settings.walkMinutes <= 0}
          onClick={() => setWalk(settings.walkMinutes - 1)}
        >
          <Minus className="size-4.5" />
        </button>
        <div className="flex w-15 flex-col items-center leading-tight">
          <span className="text-[11px] text-muted-foreground">Walk</span>
          <span className="text-[15px] font-semibold tabular-nums">{settings.walkMinutes} min</span>
        </div>
        <button
          type="button"
          aria-label="Longer walk"
          className={stepButton}
          disabled={settings.walkMinutes >= 120}
          onClick={() => setWalk(settings.walkMinutes + 1)}
        >
          <Plus className="size-4.5" />
        </button>
      </div>

      <div role="group" aria-label="Destination" className="flex gap-0.5 rounded-xl bg-muted p-[3px]">
        {(Object.keys(DESTINATIONS) as DestinationCrs[]).map((crs) => {
          const selected = settings.destination === crs;
          return (
            <button
              key={crs}
              type="button"
              aria-pressed={selected}
              className={cn(
                "h-10 rounded-[10px] px-3 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onChange({ ...settings, destination: crs })}
            >
              {SHORT_NAMES[crs]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
