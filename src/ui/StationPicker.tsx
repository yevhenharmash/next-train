import { Check, Clock, MapPin, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useMemo, useState } from "react";
import { searchStations } from "@/core/stations";
import type { Station } from "@/core/types";
import { cn } from "@/lib/utils";
import type { RouteEnd } from "./RouteCard";
import { useStationRows } from "./stations";

type Props = {
  open: boolean;
  end: RouteEnd;
  /** The station now at this end, marked with a tick. */
  selected: Station;
  recent: Station[];
  onSelect: (station: Station) => void;
  onClose: () => void;
};

/** A bottom sheet: search every station, or pick a recent one. */
export function StationPicker({ open, end, selected, recent, onSelect, onClose }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[min(700px,88dvh)] w-full max-w-md flex-col gap-3 rounded-t-3xl bg-card px-4 pt-2.5 text-card-foreground shadow-[0_-8px_32px_rgba(0,0,0,0.18)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
        >
          <Sheet end={end} selected={selected} recent={recent} onSelect={onSelect} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Mounted only while open, so the search starts empty every time. */
function Sheet({ end, selected, recent, onSelect }: Pick<Props, "end" | "selected" | "recent" | "onSelect">) {
  const [query, setQuery] = useState("");
  const { data: rows, isError } = useStationRows(true);
  const results = useMemo(() => (rows ? searchStations(rows, query) : []), [rows, query]);
  const searching = query.trim() !== "";

  return (
    <>
      <div aria-hidden className="mx-auto h-1 w-9 shrink-0 rounded-full bg-border" />
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Dialog.Title className="text-[19px] font-semibold tracking-[-0.01em]">
          {end === "from" ? "Leaving from" : "Going to"}
        </Dialog.Title>
        <Dialog.Close
          aria-label="Close"
          className="-mr-2 flex size-11 items-center justify-center rounded-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X className="size-5" />
        </Dialog.Close>
      </div>

      <form
        className="flex h-12 shrink-0 items-center gap-2.5 rounded-[14px] bg-muted px-3.5 text-muted-foreground focus-within:ring-2 focus-within:ring-foreground"
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) onSelect(results[0]);
        }}
      >
        <Search aria-hidden className="size-4.5 shrink-0" strokeWidth={2} />
        <input
          autoFocus
          type="search"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Station name or code"
          aria-label="Search stations"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>

      <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {searching ? (
          <>
            {rows && results.length > 0 && <Heading>Results</Heading>}
            <Rows stations={results} selected={selected} icon={MapPin} onSelect={onSelect} />
            {isError && <Message>Couldn't load the station list. Close this and try again.</Message>}
            {!rows && !isError && <Message>Loading stations…</Message>}
            {rows && results.length === 0 && <Message>No station matches “{query.trim()}”.</Message>}
          </>
        ) : (
          <>
            {recent.length > 0 && (
              <>
                <Heading>Recent</Heading>
                <Rows stations={recent} selected={selected} icon={Clock} onSelect={onSelect} />
              </>
            )}
            <Message>
              Type a name or a three-letter code, like “Bushey” or “BSH”.
              {rows && ` ${rows.length.toLocaleString("en-GB")} stations.`}
            </Message>
          </>
        )}
      </div>
    </>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <h3 className="mt-1 mb-1 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{children}</h3>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-center text-sm text-muted-foreground">{children}</p>;
}

function Rows({
  stations,
  selected,
  icon: Icon,
  onSelect,
}: {
  stations: Station[];
  selected: Station;
  icon: typeof MapPin;
  onSelect: (station: Station) => void;
}) {
  return (
    <div className="flex flex-col">
      {stations.map((station) => {
        const isSelected = station.crs === selected.crs;
        return (
          <button
            key={station.crs}
            type="button"
            aria-current={isSelected || undefined}
            className="flex min-h-13 w-full items-center gap-3 rounded-xl px-2 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => onSelect(station)}
          >
            <Icon aria-hidden className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className={cn("min-w-0 flex-1 text-base", isSelected ? "font-semibold" : "font-medium")}>
              {station.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{station.crs}</span>
            {isSelected && <Check aria-hidden className="size-4.5 shrink-0" strokeWidth={2.4} />}
          </button>
        );
      })}
    </div>
  );
}
