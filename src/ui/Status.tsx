import type { Running } from "@/core/types";
import { cn } from "@/lib/utils";
import { runningLabel } from "./format";

type Tone = "ok" | "late" | "bad" | "neutral";

function toneOf(running: Running): Tone {
  switch (running.kind) {
    case "on-time":
      return "ok";
    case "late":
      return running.minutes > 0 ? "late" : "ok";
    case "delayed":
      return "late";
    case "cancelled":
      return "bad";
    case "unknown":
      return "neutral";
  }
}

const ON_PAGE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  late: "bg-late-bg text-late",
  bad: "bg-bad-bg text-bad",
  neutral: "bg-muted text-muted-foreground",
};

// On the dark "next train" card: outlined, with lighter text colours.
const ON_HERO: Record<Tone, string> = {
  ok: "text-hero-ok",
  late: "text-hero-late",
  bad: "text-hero-bad",
  neutral: "text-hero-muted",
};

/** How a train is running, in words and colour (never colour alone). */
export function Status({ running, onHero = false }: { running: Running; onHero?: boolean }) {
  const tone = toneOf(running);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        onHero ? cn("border border-hero-line", ON_HERO[tone]) : ON_PAGE[tone]
      )}
    >
      {runningLabel(running)}
    </span>
  );
}
