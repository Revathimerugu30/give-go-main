import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Truck,
  UploadCloud,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DonationPatch = Database["public"]["Tables"]["donations"]["Update"];
type DonationRow = Database["public"]["Tables"]["donations"]["Row"];

import { useAuth } from "@/lib/auth";
import { uploadDonationImages } from "@/lib/storage";
import { adminIds, distanceKm, etaMinutes, geocode, logEvent, notify, VOLUNTEER_STATUS } from "@/lib/tracking";
import { useGeoBroadcast } from "@/hooks/use-geo-broadcast";
import { DashboardShell, type DashboardTab } from "@/components/dashboard-shell";
import { VolunteerPerformance } from "@/components/volunteer-performance";
import { DonationImages } from "@/components/donation-images";
import { EmptyState } from "@/components/empty-state";
import { LiveMap, type MapPoint } from "@/components/live-map";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer dashboard — ShareAt pickups" },
      { name: "description", content: "Accept assigned pickups, share live location and log deliveries." },
      { property: "og:title", content: "Volunteer dashboard — ShareAt pickups" },
      { property: "og:description", content: "Manage your assigned donation pickups with live tracking." },
    ],
  }),
  component: VolunteerDashboard,
});

const TABS: DashboardTab[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "pickups", label: "Assigned pickups", icon: ClipboardList },
  { id: "history", label: "Delivery history", icon: Package },
  { id: "performance", label: "Performance", icon: Trophy },
  { id: "profile", label: "Availability", icon: UserIcon },
];

const ACTIVE_STATUSES = ["assigned", "accepted", "traveling", "near_pickup", "collected", "in_transit"];
const LIVE_STATUSES = ["traveling", "near_pickup", "collected", "in_transit"];

function VolunteerDashboard() {
  const [tab, setTab] = useState("overview");
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const donations = useQuery({
    queryKey: ["volunteer-donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("pickup_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const volunteer = useQuery({
    queryKey: ["volunteer-record", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const all = donations.data ?? [];
  const mine = all.filter((d) => d.volunteer_id === user?.id);
  const active = mine.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const done = mine.filter((d) => ["delivered", "completed"].includes(d.status));
  const approved = volunteer.data?.is_approved ?? false;

  const liveJob = active.find((d) => LIVE_STATUSES.includes(d.status));
  const volunteerStatus =
    liveJob?.status === "collected" || liveJob?.status === "in_transit"
      ? "delivering"
      : liveJob?.status === "near_pickup"
        ? "collecting"
        : liveJob
          ? "traveling"
          : active.length > 0
            ? "assigned"
            : volunteer.data?.is_available
              ? "available"
              : "offline";

  const { position, error: geoError } = useGeoBroadcast({
    enabled: !!liveJob,
    volunteerId: user?.id,
    donationId: liveJob?.id ?? null,
    status: volunteerStatus,
  });

  useEffect(() => {
    if (!user) return;
    void supabase.from("volunteers").update({ status: volunteerStatus }).eq("user_id", user.id);
  }, [volunteerStatus, user]);

  const update = useMutation({
    mutationFn: async ({
      donation,
      patch,
      stage,
      donorMessage,
      adminMessage,
    }: {
      donation: DonationRow;
      patch: DonationPatch;
      stage: string;
      donorMessage?: string;
      adminMessage?: string;
    }) => {
      const { error } = await supabase.from("donations").update(patch).eq("id", donation.id);
      if (error) throw error;
      if (!user) return;
      await logEvent({
        donationId: donation.id,
        stage,
        actorId: user.id,
        lat: position?.lat ?? null,
        lng: position?.lng ?? null,
      });
      if (donorMessage) {
        await notify([donation.donor_id], {
          title: donation.title,
          message: donorMessage,
          type: stage,
          donationId: donation.id,
        });
      }
      if (adminMessage) {
        await notify(await adminIds(), {
          title: `${donation.title} — ${adminMessage}`,
          message: `${profile?.full_name ?? "Volunteer"} · ${donation.city}`,
          type: stage,
          donationId: donation.id,
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Pickup updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mapPoints = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    if (position) out.push({ id: "me", lat: position.lat, lng: position.lng, label: "You", kind: "volunteer" });
    if (liveJob?.pickup_lat && liveJob?.pickup_lng)
      out.push({
        id: "pickup",
        lat: liveJob.pickup_lat,
        lng: liveJob.pickup_lng,
        label: liveJob.pickup_address,
        kind: "user",
      });
    return out;
  }, [position, liveJob]);

  const km =
    position && liveJob?.pickup_lat && liveJob?.pickup_lng
      ? distanceKm([position.lat, position.lng], [liveJob.pickup_lat, liveJob.pickup_lng])
      : null;

  return (
    <DashboardShell
      allow="volunteer"
      title={`Hi ${profile?.full_name?.split(" ")[0] ?? "volunteer"}`}
      subtitle="Volunteer dashboard"
      tabs={TABS}
      active={tab}
      onSelect={setTab}
    >
      {!approved && !volunteer.isLoading && (
        <Card className="mb-6 border-warning/40 bg-warning/10 p-5">
          <p className="text-sm font-medium">Your volunteer account is awaiting admin approval.</p>
          <p className="text-sm text-muted-foreground">
            You'll start receiving pickup assignments as soon as you're approved.
          </p>
        </Card>
      )}

      <Card className="mb-6 flex-row flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`size-2.5 rounded-full ${VOLUNTEER_STATUS[volunteerStatus].dot}`} />
          {VOLUNTEER_STATUS[volunteerStatus].label}
        </div>
        <p className="text-xs text-muted-foreground">
          {liveJob
            ? position
              ? `Sharing live location · ${km !== null ? `${km.toFixed(1)} km away · ETA ${etaMinutes(km)} min` : "locating…"}`
              : (geoError ?? "Waiting for GPS permission…")
            : "Location sharing starts when you begin a journey."}
        </p>
      </Card>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active pickups" value={active.length} icon={ClipboardList} loading={donations.isLoading} />
            <StatCard
              label="Collected"
              value={mine.filter((d) => ["collected", "in_transit"].includes(d.status)).length}
              icon={Truck}
              loading={donations.isLoading}
            />
            <StatCard label="Delivered" value={done.length} icon={CheckCircle2} loading={donations.isLoading} />
            <StatCard
              label="Availability"
              value={volunteer.data?.is_available ? "On duty" : "Paused"}
              icon={UserIcon}
              loading={volunteer.isLoading}
            />
          </div>

          {liveJob && (
            <Card className="gap-4 p-5">
              <h2 className="text-lg font-semibold">Navigation</h2>
              {mapPoints.length > 0 ? (
                <LiveMap points={mapPoints} height={300} />
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for GPS…</p>
              )}
              <Button asChild variant="outline" className="w-fit">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${liveJob.pickup_address} ${liveJob.city}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="mr-1 size-4" /> Best route
                </a>
              </Button>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-lg font-semibold">Next pickups</h2>
            {active.length === 0 ? (
              <EmptyState icon={Truck} title="No pickups assigned" description="New assignments appear here." />
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {active.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pickup_date ?? "—"} {d.pickup_time ?? ""} · {d.city}
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

      {tab === "pickups" && (
        <div className="space-y-4">
          {donations.isLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : active.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Nothing assigned right now" />
          ) : (
            active.map((d) => (
              <PickupCard
                key={d.id}
                donation={d}
                busy={update.isPending}
                run={(args) => update.mutate({ donation: d, ...args })}
              />
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Delivery history</h2>
          {done.length === 0 ? (
            <EmptyState icon={Package} title="No deliveries yet" />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {done.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.city} · {new Date(d.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "performance" && <VolunteerPerformance />}

      {tab === "profile" && (
        <AvailabilityCard
          userId={user?.id}
          record={volunteer.data}
          onSaved={() => void qc.invalidateQueries({ queryKey: ["volunteer-record"] })}
        />
      )}
    </DashboardShell>
  );
}

type RunArgs = {
  patch: DonationPatch;
  stage: string;
  donorMessage?: string;
  adminMessage?: string;
};

function PickupCard({
  donation: d,
  busy,
  run,
}: {
  donation: DonationRow;
  busy: boolean;
  run: (args: RunArgs) => void;
}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const accept = async () => {
    let coords: { pickup_lat?: number; pickup_lng?: number } = {};
    if (!d.pickup_lat) {
      const geo = await geocode(`${d.pickup_address}, ${d.city}`);
      if (geo) coords = { pickup_lat: geo[0], pickup_lng: geo[1] };
    }
    run({
      patch: { status: "accepted", ...coords },
      stage: "accepted",
      donorMessage: "Your volunteer accepted the pickup.",
      adminMessage: "volunteer accepted pickup",
    });
  };

  const uploadPhoto = async (file: File, kind: "collection" | "delivery") => {
    if (!user) return;
    setUploading(true);
    try {
      const [path] = await uploadDonationImages(user.id, [file]);
      if (kind === "collection") {
        run({
          patch: { collection_photo: path, status: "collected" },
          stage: "collected",
          donorMessage: "Your item has been collected successfully.",
          adminMessage: "item collected",
        });
      } else {
        run({
          patch: { delivery_photo: path, status: "delivered" },
          stage: "delivered",
          donorMessage: "Your donation was delivered to the NGO. Thank you!",
          adminMessage: "delivery completed",
        });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const PhotoButton = ({ label, kind }: { label: string; kind: "collection" | "delivery" }) => (
    <label className="inline-flex">
      <Button size="sm" asChild disabled={busy || uploading}>
        <span className="cursor-pointer">
          {uploading ? <Loader2 className="mr-1 size-4 animate-spin" /> : <UploadCloud className="mr-1 size-4" />}
          {label}
        </span>
      </Button>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadPhoto(f, kind);
        }}
      />
    </label>
  );

  return (
    <Card className="glass-card gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{d.title}</h3>
          <p className="text-xs text-muted-foreground">
            {d.category} · Qty {d.quantity} · {d.condition}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <DonationImages paths={d.images} />
      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        {d.pickup_address}, {d.city} · {d.pickup_date ?? "—"} {d.pickup_time ?? ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${d.pickup_address} ${d.city}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="mr-1 size-4" /> Navigate
          </a>
        </Button>

        {d.status === "assigned" && (
          <>
            <Button size="sm" disabled={busy} onClick={() => void accept()}>
              <CheckCircle2 className="mr-1 size-4" /> Accept pickup
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                run({
                  patch: { status: "approved", volunteer_id: null },
                  stage: "declined",
                  donorMessage: "Your pickup is being reassigned to another volunteer.",
                  adminMessage: "volunteer declined pickup",
                })
              }
            >
              Decline
            </Button>
          </>
        )}

        {d.status === "accepted" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run({
                patch: { status: "traveling" },
                stage: "traveling",
                donorMessage: "Your volunteer is on the way.",
                adminMessage: "volunteer started journey",
              })
            }
          >
            <Truck className="mr-1 size-4" /> Start journey
          </Button>
        )}

        {d.status === "traveling" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run({
                patch: { status: "near_pickup" },
                stage: "near_pickup",
                donorMessage: "Your volunteer has reached the pickup location.",
                adminMessage: "volunteer reached pickup",
              })
            }
          >
            <MapPin className="mr-1 size-4" /> I've arrived
          </Button>
        )}

        {(d.status === "near_pickup" || d.status === "traveling") && (
          <PhotoButton label="Collect + pickup photo" kind="collection" />
        )}

        {d.status === "collected" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run({
                patch: { status: "in_transit" },
                stage: "in_transit",
                donorMessage: "Your donation is on the way to the NGO.",
                adminMessage: "on the way to NGO",
              })
            }
          >
            <Truck className="mr-1 size-4" /> On the way to NGO
          </Button>
        )}

        {d.status === "in_transit" && <PhotoButton label="Deliver + proof photo" kind="delivery" />}

        {["assigned", "accepted", "traveling", "near_pickup"].includes(d.status) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={busy}
            onClick={() =>
              run({
                patch: { status: "failed" },
                stage: "failed",
                donorMessage: "The pickup attempt failed. Our team will reschedule.",
                adminMessage: "failed pickup attempt",
              })
            }
          >
            <XCircle className="mr-1 size-4" /> Failed attempt
          </Button>
        )}
      </div>
    </Card>
  );
}

function AvailabilityCard({
  userId,
  record,
  onSaved,
}: {
  userId?: string;
  record: { is_available: boolean; service_city: string | null; vehicle: string | null } | null | undefined;
  onSaved: () => void;
}) {
  const [available, setAvailable] = useState(record?.is_available ?? true);
  const [city, setCity] = useState(record?.service_city ?? "");
  const [vehicle, setVehicle] = useState(record?.vehicle ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase
      .from("volunteers")
      .update({ is_available: available, service_city: city.trim() || null, vehicle: vehicle.trim() || null })
      .eq("user_id", userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    onSaved();
    toast.success("Availability saved");
  };

  return (
    <Card className="glass-card max-w-xl gap-5 p-6">
      <h2 className="text-lg font-semibold">Availability</h2>
      <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
        <div>
          <p className="text-sm font-medium">Accepting pickups</p>
          <p className="text-xs text-muted-foreground">Turn off when you're unavailable.</p>
        </div>
        <Switch checked={available} onCheckedChange={setAvailable} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="service-city">Service city</Label>
        <Input id="service-city" maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vehicle">Vehicle</Label>
        <Input
          id="vehicle"
          maxLength={60}
          placeholder="Two-wheeler, van…"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        />
      </div>
      <Button onClick={save} disabled={busy} className="w-fit">
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Save
      </Button>
    </Card>
  );
}
