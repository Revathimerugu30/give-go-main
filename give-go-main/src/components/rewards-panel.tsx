import { Loader2, Sparkles, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AchievementGrid, BadgeLadder, RewardCard } from "@/components/reward-card";
import { useAuth } from "@/lib/auth";
import { useDonorLeaderboard, useMyRewards } from "@/hooks/use-rewards";
import { useRealtime } from "@/hooks/use-realtime";
import { co2SavedKg } from "@/lib/rewards";

export function RewardsPanel({ completedDonations }: { completedDonations: number }) {
  const { user } = useAuth();
  const { points, achievements, total } = useMyRewards(user?.id);
  const board = useDonorLeaderboard("all");
  useRealtime("my-rewards", ["reward_points", "achievements"]);

  const rows = board.data ?? [];
  const idx = rows.findIndex((r) => r.user_id === user?.id);

  return (
    <div className="space-y-6">
      <RewardCard
        points={total}
        completed={completedDonations}
        rank={idx >= 0 ? idx + 1 : null}
        totalDonors={rows.length}
        loading={points.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="glass-card p-5">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" /> Achievements
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Unlocked automatically as your impact grows.
          </p>
          {achievements.isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <AchievementGrid achievements={achievements.data ?? []} />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="glass-card p-5">
            <p className="font-medium">Points history</p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {(points.data ?? []).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.reason}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.category ?? "General"} · {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="font-semibold text-primary">+{p.points}</span>
                </li>
              ))}
              {(points.data ?? []).length === 0 && (
                <li className="text-xs text-muted-foreground">
                  Points appear once your donation is delivered and completed.
                </li>
              )}
            </ul>
          </Card>

          <Card className="glass-card p-5">
            <p className="font-medium">Your impact</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {completedDonations} donations completed · about{" "}
              <span className="font-semibold text-foreground">
                {co2SavedKg(completedDonations)} kg
              </span>{" "}
              of CO₂ saved from landfill.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/leaderboard">
                <Trophy className="mr-1.5 size-4" /> View leaderboard
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      <Card className="glass-card p-5">
        <p className="font-medium">Badge ladder</p>
        <p className="mb-4 text-xs text-muted-foreground">Keep donating to climb the tiers.</p>
        <BadgeLadder points={total} />
      </Card>
    </div>
  );
}
