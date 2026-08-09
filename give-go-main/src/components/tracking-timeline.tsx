import { Check, Loader2 } from "lucide-react";
import { STAGES, stageIndex } from "@/lib/tracking";

/** Courier-style vertical progress timeline for one donation. */
export function TrackingTimeline({
  status,
  events,
}: {
  status: string;
  events?: { stage: string; created_at: string; note: string | null }[];
}) {
  const current = stageIndex(status);
  const failed = status === "rejected" || status === "failed";
  const stampFor = (key: string) => events?.find((e) => e.stage === key)?.created_at;

  return (
    <ol className="relative space-y-0">
      {STAGES.map((s, i) => {
        const done = !failed && i < current;
        const active = !failed && i === current;
        const stamp = stampFor(s.key);
        return (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs transition-colors ${
                  done
                    ? "border-success bg-success text-success-foreground"
                    : active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : s.emoji}
              </span>
              {i < STAGES.length - 1 && (
                <span className={`w-0.5 flex-1 ${done ? "bg-success" : "bg-border"}`} style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  done ? "text-foreground" : active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </p>
              {stamp && <p className="text-xs text-muted-foreground">{new Date(stamp).toLocaleString()}</p>}
            </div>
          </li>
        );
      })}
      {failed && (
        <li className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {status === "rejected" ? "Donation rejected by admin" : "Pickup attempt failed"}
        </li>
      )}
    </ol>
  );
}
