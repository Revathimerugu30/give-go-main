import { Loader2, Star, Timer, Trophy, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { useVolunteerLeaderboard } from "@/hooks/use-rewards";
import { useRealtime } from "@/hooks/use-realtime";
import { useAuth } from "@/lib/auth";

export function VolunteerPerformance() {
  const { user } = useAuth();
  const q = useVolunteerLeaderboard();
  useRealtime("volunteer-performance", ["donations", "volunteer_ratings"]);

  if (q.isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  const rows = q.data ?? [];
  const me = rows.find((r) => r.user_id === user?.id);
  const rank = rows.findIndex((r) => r.user_id === user?.id) + 1;

  if (!me)
    return (
      <EmptyState
        icon={Truck}
        title="No performance data yet"
        description="Complete your first pickup to unlock your performance stats."
      />
    );

  const success = me.assigned > 0 ? Math.round((me.completed / me.assigned) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Deliveries completed" value={me.completed} icon={Truck} />
        <StatCard label="Success rate" value={`${success}%`} icon={Trophy} hint={`${me.cancelled} cancelled`} />
        <StatCard
          label="Avg pickup time"
          value={me.avg_pickup_minutes ? `${Math.round(me.avg_pickup_minutes)} min` : "—"}
          icon={Timer}
        />
        <StatCard
          label="Average rating"
          value={me.rating ? me.rating.toFixed(1) : "—"}
          icon={Star}
          hint={`Rank #${rank || "—"} of ${rows.length}`}
        />
      </div>

      <Card className="glass-card p-5">
        <p className="font-medium">Delivery efficiency</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Average delivery time{" "}
          {me.avg_delivery_minutes ? `${Math.round(me.avg_delivery_minutes)} minutes` : "not available yet"}
          {me.distance_km ? ` · about ${Math.round(me.distance_km)} km travelled` : ""}.
        </p>
        <div className="space-y-4">
          <Meter label="Completed vs assigned" value={success} caption={`${me.completed}/${me.assigned}`} />
          <Meter
            label="Rating score"
            value={me.rating ? Math.round((me.rating / 5) * 100) : 0}
            caption={me.rating ? `${me.rating.toFixed(1)} / 5` : "No ratings"}
          />
        </div>
      </Card>

      <Card className="glass-card p-5">
        <p className="font-medium">Volunteer ranking</p>
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 8).map((r, i) => (
            <li
              key={r.user_id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                r.user_id === user?.id ? "border-primary/40 bg-primary/5" : "border-border/60"
              }`}
            >
              <span className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{r.full_name || "Volunteer"}</span>
              <span className="text-xs text-muted-foreground">{r.completed} delivered</span>
              <span className="inline-flex items-center gap-1 text-xs">
                <Star className="size-3.5 fill-warning text-warning" />
                {r.rating ? r.rating.toFixed(1) : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Meter({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{caption}</span>
      </div>
      <Progress value={value} className="mt-2 h-2.5" />
    </div>
  );
}
