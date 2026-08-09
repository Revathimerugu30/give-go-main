import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Loader2, Star, Trophy, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { BadgeChip, BadgeMedal } from "@/components/reward-card";
import { badgeFor } from "@/lib/rewards";
import { useAuth } from "@/lib/auth";
import {
  useDonorLeaderboard,
  useVolunteerLeaderboard,
  type LeaderboardPeriod,
  type LeaderRow,
} from "@/hooks/use-rewards";
import { useRealtime } from "@/hooks/use-realtime";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Donor & volunteer leaderboard — ShareAt" },
      {
        name: "description",
        content:
          "See the top donors and volunteers on ShareAt, ranked by reward points, completed donations and delivery performance.",
      },
      { property: "og:title", content: "Donor & volunteer leaderboard — ShareAt" },
      {
        property: "og:description",
        content: "Weekly, monthly, yearly and all-time rankings for the ShareAt community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
  { id: "all", label: "All time" },
];

function LeaderboardPage() {
  const { session, loading } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  useRealtime("leaderboard", ["reward_points", "donations"]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Trophy className="size-3.5" /> Community rankings
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-muted-foreground">
            Reward points are earned automatically when a donation is completed.
          </p>
        </header>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !session ? (
          <Card className="glass-card mt-10 p-10 text-center">
            <h2 className="text-lg font-semibold">Sign in to see the rankings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leaderboards are visible to members of the ShareAt community.
            </p>
            <Button asChild className="mt-5">
              <Link to="/auth">Sign in</Link>
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="donors" className="mt-8">
            <TabsList className="mx-auto">
              <TabsTrigger value="donors">
                <Crown className="mr-1.5 size-4" /> Donors
              </TabsTrigger>
              <TabsTrigger value="volunteers">
                <Truck className="mr-1.5 size-4" /> Volunteers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donors" className="mt-6">
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {PERIODS.map((p) => (
                  <Button
                    key={p.id}
                    size="sm"
                    variant={period === p.id ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setPeriod(p.id)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <DonorBoard period={period} />
            </TabsContent>

            <TabsContent value="volunteers" className="mt-6">
              <VolunteerBoard />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function DonorBoard({ period }: { period: LeaderboardPeriod }) {
  const { user } = useAuth();
  const q = useDonorLeaderboard(period);
  const rows = q.data ?? [];

  if (q.isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (rows.length === 0)
    return (
      <EmptyState
        icon={Trophy}
        title="No points awarded yet"
        description="Rankings appear as soon as donations are completed."
      />
    );

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

  return (
    <div className="space-y-8">
      <div className="grid items-end gap-4 sm:grid-cols-3">
        {[podium[1], podium[0], podium[2]].map((r, i) =>
          r ? (
            <Podium
              key={r.user_id}
              row={r}
              place={i === 1 ? 1 : i === 0 ? 2 : 3}
              me={r.user_id === user?.id}
            />
          ) : (
            <div key={i} />
          ),
        )}
      </div>

      {rest.length > 0 && (
        <Card className="glass-card overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {rest.map((r, i) => (
              <li
                key={r.user_id}
                className={`flex items-center gap-4 px-5 py-3.5 ${
                  r.user_id === user?.id ? "bg-primary/8" : ""
                }`}
              >
                <span className="w-6 text-sm font-semibold text-muted-foreground">{i + 4}</span>
                <Avatar name={r.full_name} url={r.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.full_name || "Anonymous donor"}
                    {r.user_id === user?.id && (
                      <span className="ml-2 text-xs text-primary">you</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.city || "—"} · {r.donations} donations
                  </p>
                </div>
                <BadgeChip points={Number(r.points)} />
                <span className="w-16 text-right text-sm font-semibold">{r.points} pts</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Podium({ row, place, me }: { row: LeaderRow; place: 1 | 2 | 3; me: boolean }) {
  const height = place === 1 ? "pt-8 pb-10" : "pt-5 pb-7";
  const crown = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  return (
    <Card
      className={`glass-card animate-rise items-center gap-2 text-center ${height} ${
        me ? "ring-2 ring-primary" : ""
      } ${place === 1 ? "scale-[1.03]" : ""}`}
      style={{ animationDelay: `${place * 80}ms` }}
    >
      <span className="text-3xl" aria-hidden>
        {crown}
      </span>
      <BadgeMedal tier={badgeFor(Number(row.points))} />
      <p className="mt-1 truncate px-3 text-sm font-semibold">{row.full_name || "Anonymous"}</p>
      <p className="text-xs text-muted-foreground">{row.city || "—"}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{row.points}</p>
      <p className="text-xs text-muted-foreground">{row.donations} donations</p>
    </Card>
  );
}

function VolunteerBoard() {
  const { user } = useAuth();
  const q = useVolunteerLeaderboard();
  const rows = q.data ?? [];

  if (q.isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (rows.length === 0)
    return <EmptyState icon={Truck} title="No volunteer activity yet" description="Rankings appear after the first pickups." />;

  return (
    <Card className="glass-card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Volunteer</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3">Success</th>
            <th className="px-4 py-3">Avg pickup</th>
            <th className="px-4 py-3">Avg delivery</th>
            <th className="px-4 py-3">Rating</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 10).map((r, i) => {
            const success = r.assigned > 0 ? Math.round((r.completed / r.assigned) * 100) : 0;
            return (
              <tr key={r.user_id} className={r.user_id === user?.id ? "bg-primary/8" : ""}>
                <td className="px-4 py-3 font-semibold text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.full_name} url={r.avatar_url} />
                    <div>
                      <p className="font-medium">{r.full_name || "Volunteer"}</p>
                      <p className="text-xs text-muted-foreground">{r.city || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{r.completed}</td>
                <td className="px-4 py-3">{success}%</td>
                <td className="px-4 py-3">
                  {r.avg_pickup_minutes ? `${Math.round(r.avg_pickup_minutes)} min` : "—"}
                </td>
                <td className="px-4 py-3">
                  {r.avg_delivery_minutes ? `${Math.round(r.avg_delivery_minutes)} min` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {r.rating ? r.rating.toFixed(1) : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url)
    return <img src={url} alt={name} className="size-9 rounded-full object-cover" loading="lazy" />;
  return (
    <span className="gradient-primary flex size-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
