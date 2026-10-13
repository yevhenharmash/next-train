import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";

/** National Rail service messages (NRCC). Dismissed ones stay hidden until the page reloads. */
export function Alerts({ messages }: { messages: string[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = messages.filter((m) => !dismissed.includes(m));
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {visible.map((message) => (
        <div
          key={message}
          role="status"
          className="flex items-start gap-2.5 rounded-[14px] bg-late-bg py-3 pr-1.5 pl-3.5"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0 text-late" />
          <p className="flex-1 text-sm">{message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            className="-my-2 flex size-9 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setDismissed((d) => [...d, message])}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
