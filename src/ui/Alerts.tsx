import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** National Rail service messages (NRCC). Dismissed ones stay hidden until the page reloads. */
export function Alerts({ messages }: { messages: string[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = messages.filter((m) => !dismissed.includes(m));
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {visible.map((message) => (
        <Alert key={message} className="pr-10">
          <TriangleAlert />
          <AlertDescription className="text-foreground">{message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-2 right-2"
            aria-label="Dismiss"
            onClick={() => setDismissed((d) => [...d, message])}
          >
            <X />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
