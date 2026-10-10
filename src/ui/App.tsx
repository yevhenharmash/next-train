import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseBoard } from "@/core/board";
import { rank } from "@/core/rank";
import { Alerts } from "./Alerts";
import { useNow } from "./clock";
import { clockTime } from "./format";
import { useBoard } from "./hooks";
import { NextTrain } from "./NextTrain";
import { DESTINATIONS, useSettings } from "./settings";
import { SettingsBar } from "./SettingsBar";
import { TrainRow } from "./TrainRow";

const ORIGIN = "WFJ";

export function App() {
  const [settings, setSettings] = useSettings();
  const now = useNow();
  const query = useBoard(ORIGIN, settings.destination);
  const destinationName = DESTINATIONS[settings.destination];

  const board = useMemo(() => {
    if (!query.data) return null;
    const parsed = parseBoard(query.data.raw, settings.destination, now);
    return { ...parsed, trains: rank(parsed.trains, now, settings.walkMinutes) };
  }, [query.data, settings, now]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Watford Junction</h1>
        {query.data?.demo && <Badge variant="secondary">Demo data</Badge>}
      </header>

      <SettingsBar settings={settings} onChange={setSettings} />

      {board ? (
        <>
          <NextTrain train={board.trains.find((t) => t.best) ?? null} destination={destinationName} now={now} />
          <Alerts messages={board.alerts} />

          {query.isError && (
            // Keep showing the last good board, but say it's stale. Never show an empty board for a failed load.
            <Alert>
              <AlertTitle>Couldn't refresh</AlertTitle>
              <AlertDescription>
                Showing the board from {clockTime(board.generatedAt)}. {query.error.message}
              </AlertDescription>
            </Alert>
          )}

          <section aria-label={`Trains to ${destinationName}, by arrival`}>
            <h2 className="text-sm font-medium text-muted-foreground">By arrival at {destinationName}</h2>
            {board.trains.length > 0 ? (
              <ul className="divide-y">
                {board.trains.map((train) => (
                  <TrainRow key={train.id} train={train} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                No trains to {destinationName} in the next 2 hours.
              </p>
            )}
          </section>

          <footer className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Updated {clockTime(board.generatedAt)} · Powered by National Rail Enquiries</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw className={query.isFetching ? "animate-spin" : undefined} />
            </Button>
          </footer>
        </>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load trains</AlertTitle>
          <AlertDescription>
            <p>{query.error.message}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <p className="py-10 text-center text-muted-foreground">Loading trains…</p>
      )}
    </main>
  );
}
