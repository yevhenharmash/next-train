import { Monitor, Moon, Sun } from "lucide-react";
import { THEMES, useTheme, type Theme } from "./theme";

const ICONS = { system: Monitor, light: Sun, dark: Moon } satisfies Record<Theme, unknown>;
const LABELS: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

/** One button that cycles System → Light → Dark. The icon shows the current theme. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const Icon = ICONS[theme];
  return (
    <button
      type="button"
      className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}`}
      title={`Theme: ${LABELS[theme]}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </button>
  );
}
