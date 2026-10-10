import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESTINATIONS, type DestinationCrs, type Settings } from "./settings";

type Props = { settings: Settings; onChange: (settings: Settings) => void };

export function SettingsBar({ settings, onChange }: Props) {
  const setWalk = (walkMinutes: number) =>
    onChange({ ...settings, walkMinutes: Math.min(120, Math.max(0, walkMinutes)) });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-1.5" role="group" aria-label="Walk to the station">
        <span className="text-muted-foreground">Walk</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Shorter walk"
          onClick={() => setWalk(settings.walkMinutes - 1)}
        >
          <Minus />
        </Button>
        <span className="w-12 text-center font-medium tabular-nums">{settings.walkMinutes} min</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Longer walk"
          onClick={() => setWalk(settings.walkMinutes + 1)}
        >
          <Plus />
        </Button>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Destination">
        {(Object.keys(DESTINATIONS) as DestinationCrs[]).map((crs) => (
          <Button
            key={crs}
            size="sm"
            variant={settings.destination === crs ? "default" : "outline"}
            aria-pressed={settings.destination === crs}
            onClick={() => onChange({ ...settings, destination: crs })}
          >
            {crs === "EUS" ? "Euston" : "Clapham Jn"}
          </Button>
        ))}
      </div>
    </div>
  );
}
