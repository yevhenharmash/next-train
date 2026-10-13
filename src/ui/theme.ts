import { useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

// The app's first name. Kept so renaming it didn't reset anyone's saved settings.
const KEY = "next-train:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
export const THEMES: Theme[] = ["system", "light", "dark"];

function load(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

/** Keep in sync with the inline script in index.html, which does the same before first paint. */
function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches);
  // Switch instantly: otherwise buttons and badges (which animate colour) fade while the rest jumps.
  const noTransitions = document.createElement("style");
  noTransitions.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(noTransitions);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b0d10" : "#f3f4f2");
  void window.getComputedStyle(document.body).backgroundColor; // force the new styles before re-enabling
  requestAnimationFrame(() => noTransitions.remove());
}

export function useTheme() {
  const [theme, setTheme] = useState(load);

  useEffect(() => {
    apply(theme);
    try {
      if (theme === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // Storage disabled: the choice just won't persist.
    }
    if (theme !== "system") return;
    // Follow the OS switching between light and dark while the page is open.
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return [theme, setTheme] as const;
}
