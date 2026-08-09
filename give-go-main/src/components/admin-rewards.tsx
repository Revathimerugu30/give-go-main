import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BadgeChip } from "@/components/reward-card";
import { useDonorLeaderboard } from "@/hooks/use-rewards";

export function AdminRewards() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, number>>({});

  const config = useQuery({
    queryKey: ["reward-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reward_config").select("*").order("category");
      if (error) throw error;
      return data;
    },
  });

  const badges = useQuery({
    queryKey: ["badge-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badge_config").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const donors = useDonorLeaderboard("all");

  const save = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(draft);
      for (const [category, points] of entries) {
        const { error } = await supabase
          .from("reward_config")
          .update({ points })
          .eq("category", category);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Reward points updated");
      setDraft({});
      void qc.invalidateQueries({ queryKey: ["reward-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Points per category</p>
            <p className="text-xs text-muted-foreground">
              Awarded automatically when a donation is completed.
            </p>
          </div>
          <Button
            size="sm"
            disabled={Object.keys(draft).length === 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-4" />
            )}
            Save
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(config.data ?? []).map((c) => (
            <div key={c.category} className="rounded-xl border border-border/60 p-3">
              <Label className="text-xs text-muted-foreground">{c.category}</Label>
              <Input
                type="number"
                min={0}
                className="mt-1"
                value={draft[c.category] ?? c.points}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [c.category]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
          {config.isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="glass-card p-5">
          <p className="font-medium">Badge thresholds</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(badges.data ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <span className="font-medium">{b.name}</span>
                <span className="text-muted-foreground">{b.min_points}+ points</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="glass-card p-5">
          <p className="flex items-center gap-2 font-medium">
            <Trophy className="size-4 text-primary" /> Top donors
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {(donors.data ?? []).slice(0, 6).map((d, i) => (
              <li key={d.user_id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2">
                <span className="w-4 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{d.full_name || "Anonymous"}</span>
                <BadgeChip points={Number(d.points)} />
                <span className="font-semibold">{d.points}</span>
              </li>
            ))}
            {(donors.data ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">No points awarded yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
