import { Coffee, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseBoard } from "@/core/board";
import { delayedBeforeBest, rank } from "@/core/rank";
import { shortName } from "@/core/stations";
import { cn } from "@/lib/utils";
import { Alerts } from "./Alerts";
import { useNow } from "./clock";
import { clockTime } from "./format";
import { useBoard } from "./hooks";
import { NextTrain } from "./NextTrain";
import { RouteCard, type RouteEnd } from "./RouteCard";
import { swapped, useSettings, walkFor, withStation, withWalk } from "./settings";
import { StationPicker } from "./StationPicker";
import { ThemeToggle } from "./ThemeToggle";
import { TrainRow } from "./TrainRow";
import { WalkRow } from "./WalkRow";

const DONATE_URL = "https://buymeacoffee.com/biteme_yevhen";

export function App() {
  const [settings, setSettings] = useSettings();
  const [picker, setPicker] = useState<{ open: boolean; end: RouteEnd }>({ open: false, end: "to" });
  const now = useNow();
  const { from, to } = settings;
  const walk = walkFor(settings, from.crs);
  const query = useBoard(from.crs, to.crs);
  const toShort = shortName(to.name);

  const board = useMemo(() => {
    if (!query.data) return null;
    const parsed = parseBoard(query.data.raw, to.crs, now);
    return { ...parsed, trains: rank(parsed.trains, now, walk) };
  }, [query.data, to.crs, walk, now]);

  const noTrains = `No direct trains from ${from.name} to ${to.name} in the next 2 hours.`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[15px] leading-snug">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-[21px] font-semibold tracking-[-0.015em]">Next train</h1>
          <p className="text-[13px] text-muted-foreground">Sorted by arrival time</p>
        </div>
        <div className="flex items-center gap-2">
          {query.data?.demo && <Badge variant="secondary">Demo data</Badge>}
          {/* Amber, like "Leave in…", so it stands apart from the theme button next to it. */}
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Buy me a coffee (opens in a new tab)"
            title="Buy me a coffee"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber text-[#101317] outline-none hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Coffee className="size-5" strokeWidth={1.8} />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <RouteCard
        from={from}
        to={to}
        onSwap={() => setSettings(swapped(settings))}
        onPick={(end) => setPicker({ open: true, end })}
      />
      <WalkRow station={from.name} minutes={walk} onChange={(minutes) => setSettings(withWalk(settings, minutes))} />
      <StationPicker
        open={picker.open}
        end={picker.end}
        selected={settings[picker.end]}
        recent={settings.recent}
        onSelect={(station) => {
          setSettings(withStation(settings, picker.end, station));
          setPicker({ ...picker, open: false });
        }}
        onClose={() => setPicker({ ...picker, open: false })}
      />

      {board ? (
        <>
          <Alerts messages={board.alerts} />
          <NextTrain
            train={board.trains.find((t) => t.best) ?? null}
            delayed={delayedBeforeBest(board.trains)}
            destination={toShort}
            walkMinutes={walk}
            emptyText={board.trains.length === 0 ? noTrains : "No train you can still catch in the next 2 hours."}
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

          {/* No trains at all: the card above already says so, an empty list would only repeat it. */}
          {board.trains.length > 0 && (
            <section aria-label={`Trains to ${to.name}, by arrival`} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <h2 className="text-[13px] font-semibold text-muted-foreground">By arrival at {toShort}</h2>
                <span aria-hidden className="text-xs text-muted-foreground">
                  dep → arr
                </span>
              </div>
              <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
                {board.trains.map((train) => (
                  <TrainRow key={train.id} train={train} />
                ))}
              </ul>
            </section>
          )}
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

      <footer className="mt-auto flex items-center justify-between gap-2 pl-1 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">
            {board && `Updated ${clockTime(board.generatedAt)} · `}Powered by National Rail Enquiries
          </span>
          <span>
            Station list:{" "}
            <a
              href="https://github.com/davwheat/uk-railway-stations"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              davwheat, Trainline EU
            </a>{" "}
            (ODbL)
          </span>
        </div>
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
    </main>
  );
}
