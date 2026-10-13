import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseBoard } from "@/core/board";
import { delayedBeforeBest, rank } from "@/core/rank";
import { cn } from "@/lib/utils";
import { Alerts } from "./Alerts";
import { useNow } from "./clock";
import { clockTime } from "./format";
import { useBoard } from "./hooks";
import { NextTrain } from "./NextTrain";
import { DESTINATIONS, SHORT_NAMES, useSettings } from "./settings";
import { SettingsBar } from "./SettingsBar";
import { ThemeToggle } from "./ThemeToggle";
import { TrainRow } from "./TrainRow";

const ORIGIN = "WFJ";

export function App() {
  const [settings, setSettings] = useSettings();
  const now = useNow();
  const query = useBoard(ORIGIN, settings.destination);
  const destinationName = DESTINATIONS[settings.destination];
  const destinationShort = SHORT_NAMES[settings.destination];

  const board = useMemo(() => {
    if (!query.data) return null;
    const parsed = parseBoard(query.data.raw, settings.destination, now);
    return { ...parsed, trains: rank(parsed.trains, now, settings.walkMinutes) };
  }, [query.data, settings, now]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[15px] leading-snug">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-[21px] font-semibold tracking-[-0.015em]">Watford Junction</h1>
          <p className="text-[13px] text-muted-foreground">to {destinationName}, by arrival time</p>
        </div>
        <div className="flex items-center gap-2">
          {query.data?.demo && <Badge variant="secondary">Demo data</Badge>}
          <ThemeToggle />
        </div>
      </header>

      <SettingsBar settings={settings} onChange={setSettings} />

      {board ? (
        <>
          <Alerts messages={board.alerts} />
          <NextTrain
            train={board.trains.find((t) => t.best) ?? null}
            delayed={delayedBeforeBest(board.trains)}
            destination={destinationShort}
            walkMinutes={settings.walkMinutes}
            now={now}
          />

          {query.isError && (
            // Keep showing the last good board, but say it's stale. Never show an empty board for a failed load.
            <div
              role="status"
              className="flex items-center justify-between gap-2.5 rounded-[14px] border bg-card py-1 pr-1 pl-3.5"
            >
              <p className="text-[13px] text-muted-foreground" title={query.error.message}>
                <strong className="font-semibold text-foreground">Couldn't refresh.</strong> Showing the board from{" "}
                {clockTime(board.generatedAt)}.
              </p>
              <Button
                variant="secondary"
                className="h-10 rounded-[10px] text-[13px] font-semibold"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          <section aria-label={`Trains to ${destinationName}, by arrival`} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <h2 className="text-[13px] font-semibold text-muted-foreground">By arrival at {destinationShort}</h2>
              <span aria-hidden className="text-xs text-muted-foreground">
                dep → arr
              </span>
            </div>
            {board.trains.length > 0 ? (
              <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
                {board.trains.map((train) => (
                  <TrainRow key={train.id} train={train} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-muted-foreground">
                No trains to {destinationName} in the next 2 hours.
              </p>
            )}
          </section>

          <footer className="mt-auto flex items-center justify-between gap-2 pl-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Updated {clockTime(board.generatedAt)} · Powered by National Rail Enquiries
            </span>
            <button
              type="button"
              aria-label="Refresh"
              disabled={query.isFetching}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => void query.refetch()}
            >
              <RefreshCw className={cn("size-4.5", query.isFetching && "animate-spin")} strokeWidth={1.8} />
            </button>
          </footer>
        </>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-4">
          <p className="font-semibold">Couldn't load trains</p>
          <p className="text-sm text-muted-foreground">{query.error.message}</p>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <p className="py-10 text-center text-muted-foreground">Loading trains…</p>
      )}
    </main>
  );
}
