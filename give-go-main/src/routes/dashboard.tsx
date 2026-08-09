import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Gift,
  LayoutDashboard,
  Loader2,
  Navigation,
  Package,
  Search,
  Trophy,
  Truck,
  UploadCloud,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadDonationImages } from "@/lib/storage";
import { adminIds, geocode, logEvent, notify } from "@/lib/tracking";
import { DashboardShell, type DashboardTab } from "@/components/dashboard-shell";
import { DonationImages } from "@/components/donation-images";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { RewardsPanel } from "@/components/rewards-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My donations — ShareAt dashboard" },
      { name: "description", content: "Track your donations, book pickups and manage your profile." },
      { property: "og:title", content: "My donations — ShareAt dashboard" },
      { property: "og:description", content: "Track donations and pickups on ShareAt." },
    ],
  }),
  component: UserDashboard,
});

const TABS: DashboardTab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "donate", label: "Donate item", icon: Gift },
  { id: "history", label: "My donations", icon: Package },
  { id: "rewards", label: "Rewards", icon: Trophy },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: UserIcon },
];

const CONDITIONS = ["New", "Like new", "Good", "Fair"];

const donationSchema = z.object({
  title: z.string().trim().min(3, "Give your donation a short title").max(120),
  category: z.string().min(1, "Pick a category"),
  quantity: z.coerce.number().int().min(1).max(999),
  condition: z.string().min(1),
  description: z.string().trim().max(1000).optional(),
  pickup_address: z.string().trim().min(6, "Enter a pickup address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(80),
  pickup_date: z.string().min(1, "Choose a pickup date"),
  pickup_time: z.string().min(1, "Choose a time slot"),
});

const TIME_SLOTS = ["09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00", "18:00 - 20:00"];

function UserDashboard() {
  const [tab, setTab] = useState("overview");
  const { user, profile, refresh } = useAuth();
  const qc = useQueryClient();

  const donations = useQuery({
    queryKey: ["my-donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
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

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const list = donations.data ?? [];
  const stats = {
    total: list.length,
    pending: list.filter((d) => ["pending", "approved", "assigned"].includes(d.status)).length,
    collected: list.filter((d) => d.status === "collected").length,
    delivered: list.filter((d) => ["delivered", "completed"].includes(d.status)).length,
  };

  return (
    <DashboardShell
      allow="user"
      title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "friend"}`}
      subtitle="Donor dashboard"
      tabs={TABS}
      active={tab}
      onSelect={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total donations" value={stats.total} icon={Gift} loading={donations.isLoading} />
            <StatCard label="In progress" value={stats.pending} icon={Package} loading={donations.isLoading} />
            <StatCard label="Collected" value={stats.collected} icon={Truck} loading={donations.isLoading} />
            <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} loading={donations.isLoading} />
          </div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            {donations.isLoading ? (
              <Skeleton className="mt-4 h-32 rounded-xl" />
            ) : list.length === 0 ? (
              <EmptyState
                title="No donations yet"
                description="Your first listing takes about a minute."
                action={<Button onClick={() => setTab("donate")}>Donate an item</Button>}
              />
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {list.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.category} · {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "donate" && (
        <DonationForm
          categories={(categories.data ?? []).map((c) => c.name)}
          onDone={() => {
            void qc.invalidateQueries({ queryKey: ["my-donations"] });
            setTab("history");
          }}
        />
      )}

      {tab === "history" && <DonationHistory loading={donations.isLoading} donations={list} />}

      {tab === "rewards" && <RewardsPanel completedDonations={stats.delivered} />}

      {tab === "notifications" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {notifications.isLoading ? (
            <Skeleton className="mt-4 h-32 rounded-xl" />
          ) : (notifications.data ?? []).length === 0 ? (
            <EmptyState icon={Bell} title="Nothing new" description="Updates on your donations show up here." />
          ) : (
            <ul className="mt-4 space-y-3">
              {(notifications.data ?? []).map((n) => (
                <li key={n.id} className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "profile" && <ProfileForm onSaved={refresh} />}
    </DashboardShell>
  );
}

function DonationForm({ categories, onDone }: { categories: string[]; onDone: () => void }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    quantity: "1",
    condition: "Good",
    description: "",
    pickup_address: "",
    city: "",
    pickup_date: "",
    pickup_time: "",
  });

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const create = useMutation({
    mutationFn: async () => {
      const parsed = donationSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!user) throw new Error("Not signed in");
      const images = files.length ? await uploadDonationImages(user.id, files) : [];
      const geo = await geocode(`${parsed.data.pickup_address}, ${parsed.data.city}`);
      const { data: created, error } = await supabase
        .from("donations")
        .insert({
          ...parsed.data,
          description: parsed.data.description || null,
          donor_id: user.id,
          images,
          pickup_lat: geo?.[0] ?? null,
          pickup_lng: geo?.[1] ?? null,
        })
        .select("id, title, city")
        .single();
      if (error) throw error;
      await logEvent({ donationId: created.id, stage: "pending", actorId: user.id });
      await notify([user.id], {
        title: "Donation submitted",
        message: `${created.title} is now awaiting admin review.`,
        type: "pending",
        donationId: created.id,
      });
      await notify(await adminIds(), {
        title: "New donation submitted",
        message: `${created.title} · ${created.city}`,
        type: "pending",
        donationId: created.id,
      });
    },
    onSuccess: () => {
      toast.success("Donation submitted for review");
      setFiles([]);
      setForm({
        title: "",
        category: "",
        quantity: "1",
        condition: "Good",
        description: "",
        pickup_address: "",
        city: "",
        pickup_date: "",
        pickup_time: "",
      });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card className="glass-card p-6">
      <h2 className="text-lg font-semibold">Donate an item</h2>
      <p className="text-sm text-muted-foreground">
        Tell us what you're giving and when a volunteer can collect it.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Item title</Label>
          <Input id="title" maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Condition</Label>
          <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={999}
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" maxLength={80} value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Pickup address</Label>
          <Input
            id="address"
            maxLength={300}
            value={form.pickup_address}
            onChange={(e) => set("pickup_address", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Pickup date</Label>
          <Input
            id="date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.pickup_date}
            onChange={(e) => set("pickup_date", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Time slot</Label>
          <Select value={form.pickup_time} onValueChange={(v) => set("pickup_time", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a slot" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            maxLength={1000}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="images">Photos</Label>
          <label
            htmlFor="images"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center hover:bg-muted/50"
          >
            <UploadCloud className="size-6 text-primary" />
            <span className="mt-2 text-sm font-medium">Click to upload images</span>
            <span className="text-xs text-muted-foreground">PNG or JPG, up to 5 files</span>
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
          />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((p) => (
                <img key={p} src={p} alt="Selected item preview" className="size-20 rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={create.isPending} className="w-full sm:w-auto">
            {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Submit donation
          </Button>
        </div>
      </form>
    </Card>
  );
}

type DonationRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  quantity: number;
  city: string;
  condition: string;
  pickup_date: string | null;
  pickup_time: string | null;
  created_at: string;
  images: string[];
};

function DonationHistory({ donations, loading }: { donations: DonationRow[]; loading: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = donations.filter(
    (d) =>
      (status === "all" || d.status === status) &&
      (d.title.toLowerCase().includes(q.toLowerCase()) ||
        d.category.toLowerCase().includes(q.toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  const download = (d: DonationRow) => {
    const text = `ShareAt donation receipt\n\nReference: ${d.id}\nItem: ${d.title}\nCategory: ${d.category}\nQuantity: ${d.quantity}\nCondition: ${d.condition}\nCity: ${d.city}\nStatus: ${d.status}\nCreated: ${new Date(d.created_at).toLocaleString()}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `shareat-receipt-${d.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search your donations"
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
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
      ) : shown.length === 0 ? (
        <EmptyState title="No donations match" description="Try clearing the search or filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((d) => (
            <Card key={d.id} className="glass-card gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{d.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {d.category} · Qty {d.quantity} · {d.condition}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <DonationImages paths={d.images} />
              <p className="text-xs text-muted-foreground">
                Pickup: {d.pickup_date ?? "—"} {d.pickup_time ?? ""} · {d.city}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Ref {d.id.slice(0, 8).toUpperCase()}</span>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link to="/track/$id" params={{ id: d.id }}>
                      <Navigation className="mr-1 size-4" /> Track live
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(d)}>
                    Receipt
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ProfileForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    address: profile?.address ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.full_name.trim().length < 2) return toast.error("Enter your name");
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await onSaved();
    toast.success("Profile updated");
  };

  return (
    <Card className="glass-card max-w-xl p-6">
      <h2 className="text-lg font-semibold">Your profile</h2>
      <form onSubmit={save} className="mt-5 space-y-4">
        {(
          [
            ["full_name", "Full name", 100],
            ["phone", "Phone", 20],
            ["city", "City", 80],
            ["address", "Address", 300],
          ] as const
        ).map(([key, label, max]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              maxLength={max}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={profile?.email ?? ""} disabled />
        </div>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Save changes
        </Button>
      </form>
    </Card>
  );
}
