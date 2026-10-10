import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, useTheme, type Theme } from "./theme";

const ICONS = { system: Monitor, light: Sun, dark: Moon } satisfies Record<Theme, unknown>;
const LABELS: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

/** One button that cycles System → Light → Dark. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const Icon = ICONS[theme];
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}`}
      title={`Theme: ${LABELS[theme]}`}
      onClick={() => setTheme(next)}
    >
      <Icon />
      {LABELS[theme]}
    </Button>
  );
}
