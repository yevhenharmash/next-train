import { useEffect, useState } from "react";

/** The only place the app reads the real clock. Re-renders every `intervalMs` without refetching. */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    // Catch up straight away when the tab comes back (intervals are throttled in hidden tabs).
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
  return now;
}
