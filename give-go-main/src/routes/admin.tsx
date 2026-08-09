import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  FileDown,
  Gift,
  LayoutDashboard,
  Loader2,
  Search,
  ShieldCheck,
  Tags,
  Trophy,
  Truck,
  Radio,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DonationPatch = Database["public"]["Tables"]["donations"]["Update"];
import { DashboardShell, type DashboardTab } from "@/components/dashboard-shell";
import { AdminAnalytics } from "@/components/admin-analytics";
import { AdminRewards } from "@/components/admin-rewards";
import { DonationImages } from "@/components/donation-images";
import { EmptyState } from "@/components/empty-state";
import { LiveMap, type MapPoint } from "@/components/live-map";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { adminIds, formatAgo, notify, progressPercent, VOLUNTEER_STATUS } from "@/lib/tracking";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — ShareAt operations" },
      { name: "description", content: "Approve donations, manage volunteers and track platform analytics." },
      { property: "og:title", content: "Admin console — ShareAt operations" },
      { property: "og:description", content: "Moderate donations and manage the ShareAt community." },
    ],
  }),
  component: AdminDashboard,
});

const TABS: DashboardTab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "live", label: "Live monitoring", icon: Radio },
  { id: "donations", label: "Donations", icon: Gift },
  { id: "volunteers", label: "Volunteers", icon: Truck },
  { id: "users", label: "Users", icon: Users },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rewards", label: "Rewards", icon: Trophy },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "notify", label: "Notifications", icon: Bell },
];

function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const qc = useQueryClient();

  const donations = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const volunteers = useQuery({
    queryKey: ["admin-volunteers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const mutate = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => {
      const { error } = await fn();
      if (error) throw error as Error;
    },
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = donations.data ?? [];
  const vols = volunteers.data ?? [];
  const people = profiles.data ?? [];

  const nameFor = (id: string) => people.find((p) => p.id === id)?.full_name ?? "Unknown";

  return (
    <DashboardShell
      allow="admin"
      title="Admin console"
      subtitle="Platform operations"
      tabs={TABS}
      active={tab}
      onSelect={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total donations" value={list.length} icon={Gift} loading={donations.isLoading} />
            <StatCard
              label="Pending review"
              value={list.filter((d) => d.status === "pending").length}
              icon={ShieldCheck}
              loading={donations.isLoading}
            />
            <StatCard label="Registered users" value={people.length} icon={Users} loading={profiles.isLoading} />
            <StatCard
              label="Approved volunteers"
              value={vols.filter((v) => v.is_approved).length}
              icon={Truck}
              loading={volunteers.isLoading}
            />
          </div>
          <MonthlyChart donations={list} />
        </div>
      )}

      {tab === "donations" && (
        <AdminDonations
          donations={list}
          loading={donations.isLoading}
          volunteers={vols.filter((v) => v.is_approved)}
          nameFor={nameFor}
          onPatch={(id: string, patch: DonationPatch) =>
            mutate.mutate(async () => {
              const res = await supabase.from("donations").update(patch).eq("id", id);
              const d = list.find((x) => x.id === id);
              if (!res.error && d) {
                const msg =
                  patch.status === "approved"
                    ? "Your donation was approved."
                    : patch.status === "rejected"
                      ? "Your donation was rejected by the admin team."
                      : patch.status === "assigned"
                        ? "A volunteer has been assigned to your pickup."
                        : patch.status === "completed"
                          ? "Your donation journey is complete. Thank you!"
                          : null;
                if (msg)
                  await notify([d.donor_id], {
                    title: d.title,
                    message: msg,
                    type: String(patch.status),
                    donationId: id,
                  });
                if (patch.status === "assigned" && patch.volunteer_id)
                  await notify([patch.volunteer_id], {
                    title: "New pickup assigned",
                    message: `${d.title} · ${d.pickup_address}, ${d.city}`,
                    type: "assigned",
                    donationId: id,
                  });
              }
              return res;
            })
          }
          busy={mutate.isPending}
        />
      )}

      {tab === "volunteers" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Volunteer applications</h2>
          {volunteers.isLoading ? (
            <Skeleton className="mt-4 h-40 rounded-xl" />
          ) : vols.length === 0 ? (
            <EmptyState icon={Truck} title="No volunteers yet" />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {vols.map((v) => (
                <li key={v.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{nameFor(v.user_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.service_city ?? "City not set"} · {v.vehicle ?? "No vehicle listed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {v.is_approved ? "Approved" : "Pending"}
                    </Badge>
                    <Button
                      size="sm"
                      variant={v.is_approved ? "outline" : "default"}
                      disabled={mutate.isPending}
                      onClick={() =>
                        mutate.mutate(() =>
                          supabase
                            .from("volunteers")
                            .update({ is_approved: !v.is_approved })
                            .eq("user_id", v.user_id),
                        )
                      }
                    >
                      {v.is_approved ? "Revoke" : "Approve"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "users" && (
        <UsersPanel
          people={people}
          loading={profiles.isLoading}
          busy={mutate.isPending}
          onToggle={(id, suspended) =>
            mutate.mutate(() => supabase.from("profiles").update({ is_suspended: suspended }).eq("id", id))
          }
        />
      )}

      {tab === "categories" && (
        <CategoriesPanel
          categories={categories.data ?? []}
          busy={mutate.isPending}
          onAdd={(name) => mutate.mutate(() => supabase.from("categories").insert({ name }))}
          onDelete={(id) => mutate.mutate(() => supabase.from("categories").delete().eq("id", id))}
        />
      )}

      {tab === "analytics" && <AdminAnalytics />}

      {tab === "rewards" && <AdminRewards />}

      {tab === "reports" && <ReportsPanel donations={list} />}

      {tab === "live" && <LivePanel donations={list} nameFor={nameFor} />}

      {tab === "notify" && <NotifyPanel people={people} />}
    </DashboardShell>
  );
}

type Donation = {
  id: string;
  title: string;
  category: string;
  status: string;
  city: string;
  quantity: number;
  condition: string;
  donor_id: string;
  volunteer_id: string | null;
  pickup_address: string;
  pickup_date: string | null;
  pickup_time: string | null;
  created_at: string;
  images: string[];
};

function MonthlyChart({ donations }: { donations: Donation[] }) {
  const months = useMemo(() => {
    const out: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString(undefined, { month: "short" });
      const count = donations.filter((x) => {
        const c = new Date(x.created_at);
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
      }).length;
      out.push({ label, count });
    }
    return out;
  }, [donations]);

  const max = Math.max(1, ...months.map((m) => m.count));

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Donations over the last 6 months</h2>
      <div className="mt-6 flex h-48 items-end gap-4">
        {months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{m.count}</span>
            <div
              className="gradient-primary w-full rounded-t-lg transition-all"
              style={{ height: `${(m.count / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminDonations({
  donations,
  loading,
  volunteers,
  nameFor,
  onPatch,
  busy,
}: {
  donations: Donation[];
  loading: boolean;
  volunteers: { user_id: string }[];
  nameFor: (id: string) => string;
  onPatch: (id: string, patch: DonationPatch) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = donations.filter(
    (d) =>
      (status === "all" || d.status === status) &&
      (d.title.toLowerCase().includes(q.toLowerCase()) ||
        d.city.toLowerCase().includes(q.toLowerCase()) ||
        d.category.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search title, city or category"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "pending", "approved", "assigned", "collected", "delivered", "rejected"].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No donations found" />
      ) : (
        filtered.map((d) => (
          <Card key={d.id} className="glass-card gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{d.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {nameFor(d.donor_id)} · {d.category} · Qty {d.quantity} · {d.city}
                </p>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <DonationImages paths={d.images} />
            <p className="text-xs text-muted-foreground">
              {d.pickup_address} · {d.pickup_date ?? "—"} {d.pickup_time ?? ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {d.status === "pending" && (
                <>
                  <Button size="sm" disabled={busy} onClick={() => onPatch(d.id, { status: "approved" })}>
                    <CheckCircle2 className="mr-1 size-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onPatch(d.id, { status: "rejected" })}
                  >
                    <XCircle className="mr-1 size-4" /> Reject
                  </Button>
                </>
              )}
              {d.status === "approved" && (
                <Select
                  onValueChange={(v) => onPatch(d.id, { volunteer_id: v, status: "assigned" })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Assign a volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No approved volunteers
                      </SelectItem>
                    ) : (
                      volunteers.map((v) => (
                        <SelectItem key={v.user_id} value={v.user_id}>
                          {nameFor(v.user_id)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {d.status === "delivered" && (
                <Button size="sm" disabled={busy} onClick={() => onPatch(d.id, { status: "completed" })}>
                  Mark completed
                </Button>
              )}
              {d.volunteer_id && (
                <span className="text-xs text-muted-foreground">
                  Volunteer: {nameFor(d.volunteer_id)}
                </span>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function UsersPanel({
  people,
  loading,
  busy,
  onToggle,
}: {
  people: { id: string; full_name: string; email: string; city: string | null; is_suspended: boolean }[];
  loading: boolean;
  busy: boolean;
  onToggle: (id: string, suspended: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = people.filter(
    (p) =>
      p.full_name.toLowerCase().includes(q.toLowerCase()) ||
      p.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Registered users</h2>
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-40 rounded-xl" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {filtered.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.email} {p.city ? `· ${p.city}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.is_suspended && (
                  <Badge variant="secondary" className="rounded-full bg-destructive/15 text-destructive">
                    Suspended
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onToggle(p.id, !p.is_suspended)}
                >
                  {p.is_suspended ? "Reinstate" : "Suspend"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CategoriesPanel({
  categories,
  busy,
  onAdd,
  onDelete,
}: {
  categories: { id: string; name: string }[];
  busy: boolean;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Card className="max-w-2xl p-6">
      <h2 className="text-lg font-semibold">Donation categories</h2>
      <div className="mt-4 flex gap-2">
        <Input
          value={name}
          maxLength={40}
          placeholder="New category name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          disabled={busy || name.trim().length < 2}
          onClick={() => {
            onAdd(name.trim());
            setName("");
          }}
        >
          Add
        </Button>
      </div>
      <ul className="mt-5 divide-y divide-border">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm">{c.name}</span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDelete(c.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ReportsPanel({ donations }: { donations: Donation[] }) {
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    donations.forEach((d) => map.set(d.category, (map.get(d.category) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [donations]);

  const exportCsv = () => {
    const header = "id,title,category,status,city,quantity,created_at\n";
    const rows = donations
      .map((d) =>
        [d.id, `"${d.title.replace(/"/g, "'")}"`, d.category, d.status, d.city, d.quantity, d.created_at].join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shareat-donations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Donations by category</h2>
          <Button variant="outline" onClick={exportCsv}>
            <FileDown className="mr-1 size-4" /> Export CSV
          </Button>
        </div>
        {byCategory.length === 0 ? (
          <EmptyState title="No data yet" />
        ) : (
          <ul className="mt-4 space-y-3">
            {byCategory.map(([cat, count]) => (
              <li key={cat}>
                <div className="flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="gradient-primary h-2 rounded-full"
                    style={{ width: `${(count / byCategory[0][1]) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NotifyPanel({ people }: { people: { id: string; full_name: string }[] }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || message.trim().length < 5) {
      return toast.error("Add a title and message");
    }
    setBusy(true);
    const rows = people.map((p) => ({ user_id: p.id, title: title.trim(), message: message.trim() }));
    const { error } = await supabase.from("notifications").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setMessage("");
    toast.success(`Sent to ${rows.length} people`);
  };

  return (
    <Card className="glass-card max-w-xl p-6">
      <h2 className="text-lg font-semibold">Broadcast a notification</h2>
      <form onSubmit={send} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ntitle">Title</Label>
          <Input id="ntitle" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nmsg">Message</Label>
          <Textarea id="nmsg" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Send to all users
        </Button>
      </form>
    </Card>
  );
}

function LivePanel({
  donations,
  nameFor,
}: {
  donations: Donation[];
  nameFor: (id: string) => string;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const locations = useQuery({
    queryKey: ["volunteer-locations"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteer_locations").select("*");
      if (error) throw error;
      return data;
    },
  });

  const events = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const locs = locations.data ?? [];
  const active = donations.filter((d) =>
    ["assigned", "accepted", "traveling", "near_pickup", "collected", "in_transit"].includes(d.status),
  );
  const filtered = active.filter(
    (d) =>
      q.trim() === "" ||
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.id.toLowerCase().includes(q.toLowerCase()) ||
      nameFor(d.volunteer_id ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const points: MapPoint[] = locs
    .filter((l) => l.status !== "offline")
    .map((l) => ({
      id: l.volunteer_id,
      lat: l.lat,
      lng: l.lng,
      label: nameFor(l.volunteer_id),
      kind: "volunteer" as const,
    }));

  const chosen = donations.find((d) => d.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active pickups" value={active.length} icon={Truck} />
        <StatCard label="Volunteers online" value={points.length} icon={Radio} />
        <StatCard
          label="Completed"
          value={donations.filter((d) => ["delivered", "completed"].includes(d.status)).length}
          icon={CheckCircle2}
        />
      </div>

      <Card className="gap-4 p-5">
        <h2 className="text-lg font-semibold">Live volunteer map</h2>
        {points.length === 0 ? (
          <EmptyState icon={Radio} title="No volunteers sharing location right now" />
        ) : (
          <LiveMap points={points} height={340} />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Active pickups</h2>
            <div className="relative w-56">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search donation or volunteer"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="Nothing in progress" />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((d) => {
                const loc = locs.find((l) => l.volunteer_id === d.volunteer_id);
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelected(d.id)}
                      className="w-full py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">
                            #{d.id.slice(0, 8).toUpperCase()} ·{" "}
                            {d.volunteer_id ? nameFor(d.volunteer_id) : "unassigned"} ·{" "}
                            {loc ? `updated ${formatAgo(loc.updated_at)}` : "no GPS"}
                          </p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="gradient-primary h-full rounded-full"
                          style={{ width: `${progressPercent(d.status)}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-3 p-5">
          <h2 className="text-lg font-semibold">Live activity feed</h2>
          {(events.data ?? []).length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="space-y-2.5">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-sm font-medium capitalize">{e.stage.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {nameFor(e.actor_id ?? "")} · {formatAgo(e.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="gap-4 p-5">
        <h2 className="text-lg font-semibold">Volunteer status board</h2>
        {locs.length === 0 ? (
          <EmptyState title="No volunteer sessions yet" />
        ) : (
          <ul className="divide-y divide-border">
            {locs.map((l) => (
              <li key={l.volunteer_id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm font-medium">{nameFor(l.volunteer_id)}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`size-2.5 rounded-full ${VOLUNTEER_STATUS[l.status]?.dot ?? "bg-muted"}`} />
                  {VOLUNTEER_STATUS[l.status]?.label ?? l.status} · {formatAgo(l.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {chosen && (
        <Card className="gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{chosen.title}</h2>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Donor: {nameFor(chosen.donor_id)} · Volunteer:{" "}
            {chosen.volunteer_id ? nameFor(chosen.volunteer_id) : "unassigned"}
          </p>
          <p className="text-sm text-muted-foreground">
            {chosen.pickup_address}, {chosen.city} · {chosen.pickup_date ?? "—"} {chosen.pickup_time ?? ""}
          </p>
          <DonationImages paths={chosen.images} size="size-20" />
          <TrackingTimeline status={chosen.status} />
        </Card>
      )}
    </div>
  );
}
