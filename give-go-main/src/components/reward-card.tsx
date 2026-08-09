import { useEffect, useRef, useState } from "react";
import { Award, Crown, Medal, Trophy, Gift, Truck, Globe, Star, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { badgeFor, badgeProgress, nextBadge, BADGE_TIERS, type BadgeTier } from "@/lib/rewards";

const ICONS: Record<string, LucideIcon> = {
  medal: Medal,
  award: Award,
  trophy: Trophy,
  crown: Crown,
  gift: Gift,
  truck: Truck,
  globe: Globe,
  star: Star,
  flame: Flame,
};

/** Smooth count-up number. */
export function AnimatedNumber({
  value,
  duration = 900,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(initial + (value - initial) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function BadgeMedal({ tier, size = "md" }: { tier: BadgeTier; size?: "sm" | "md" | "lg" }) {
  const Icon = ICONS[tier.icon] ?? Award;
  const dim = size === "lg" ? "size-20" : size === "sm" ? "size-9" : "size-14";
  const inner = size === "lg" ? "size-9" : size === "sm" ? "size-4" : "size-6";
  return (
    <span
      className={`relative flex ${dim} shrink-0 animate-[badge-pop_.6s_cubic-bezier(.34,1.56,.64,1)] items-center justify-center rounded-full bg-gradient-to-br ${tier.ring} ${tier.glow} text-white`}
      title={tier.name}
    >
      <Icon className={inner} />
    </span>
  );
}

export function BadgeChip({ points }: { points: number }) {
  const tier = badgeFor(points);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tier.chip}`}
    >
      <span aria-hidden>{tier.emoji}</span>
      {tier.name}
    </span>
  );
}

export function RewardCard({
  points,
  completed,
  rank,
  totalDonors,
  loading,
}: {
  points: number;
  completed: number;
  rank: number | null;
  totalDonors: number;
  loading?: boolean;
}) {
  const tier = badgeFor(points);
  const next = nextBadge(points);
  const pct = badgeProgress(points);

  return (
    <Card className="glass-card relative overflow-hidden p-6">
      <div
        className={`pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-gradient-to-br ${tier.ring} opacity-15 blur-2xl`}
      />
      <div className="relative flex flex-wrap items-center gap-5">
        <BadgeMedal tier={tier} size="lg" />
        <div className="min-w-40 flex-1">
          <p className="text-sm text-muted-foreground">Your badge</p>
          <h2 className="text-2xl font-semibold tracking-tight">{tier.name}</h2>
          <p className="text-sm text-muted-foreground">{tier.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total reward points</p>
          <p className="text-4xl font-bold tracking-tight text-primary">
            {loading ? "—" : <AnimatedNumber value={points} />}
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Donations completed" value={completed} />
        <Metric label="Leaderboard rank" value={rank ?? 0} prefix="#" empty={rank === null} />
        <Metric
          label="Achievement progress"
          value={pct}
          suffix="%"
        />
      </div>

      <div className="relative mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {next ? `Next badge · ${next.emoji} ${next.name}` : "Top tier reached — legendary!"}
          </span>
          <span className="font-medium">
            {next ? `${Math.max(0, next.min - points)} pts to go` : `${points} pts`}
          </span>
        </div>
        <Progress value={pct} className="mt-2 h-2.5" />
        {totalDonors > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            You are ranked among {totalDonors.toLocaleString()} donors this season.
          </p>
        )}
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  suffix,
  prefix,
  empty,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  empty?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {empty ? "—" : (
          <>
            {prefix}
            <AnimatedNumber value={value} suffix={suffix} />
          </>
        )}
      </p>
    </div>
  );
}

export interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export function AchievementGrid({ achievements }: { achievements: AchievementRow[] }) {
  const CATALOG = [
    { code: "first_donation", title: "First Donation", emoji: "🏅" },
    { code: "five_donations", title: "5 Donations Completed", emoji: "🎁" },
    { code: "deliveries_25", title: "25 Successful Deliveries", emoji: "🚚" },
    { code: "helped_100", title: "Helped 100 Families", emoji: "🌍" },
    { code: "streak_30", title: "30-Day Donation Streak", emoji: "🔥" },
    { code: "top_donor_month", title: "Top Donor of the Month", emoji: "⭐" },
    { code: "super_donor", title: "Super Donor", emoji: "👑" },
  ];
  const unlocked = new Map(achievements.map((a) => [a.code, a]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CATALOG.map((c) => {
        const a = unlocked.get(c.code);
        return (
          <div
            key={c.code}
            className={`rounded-2xl border p-4 transition-all ${
              a
                ? "animate-[badge-pop_.5s_ease-out] border-primary/40 bg-primary/5 shadow-sm"
                : "border-dashed border-border/70 bg-muted/20 opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {c.emoji}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a
                    ? `Unlocked ${new Date(a.unlocked_at).toLocaleDateString()}`
                    : "Locked"}
                </p>
              </div>
            </div>
            {a?.description && (
              <p className="mt-2 text-xs text-muted-foreground">{a.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BadgeLadder({ points }: { points: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {BADGE_TIERS.map((t) => {
        const reached = points >= t.min;
        return (
          <div
            key={t.name}
            className={`rounded-2xl border p-4 text-center ${
              reached ? "border-primary/40 bg-primary/5" : "border-dashed border-border/70 opacity-60"
            }`}
          >
            <div className="flex justify-center">
              <BadgeMedal tier={t} />
            </div>
            <p className="mt-3 text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-muted-foreground">
              {t.min}
              {t.name === "Super Donor" ? "+" : `–${(BADGE_TIERS[BADGE_TIERS.indexOf(t) + 1]?.min ?? 0) - 1}`} points
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
          </div>
        );
      })}
    </div>
  );
}
