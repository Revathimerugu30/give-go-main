import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Navigation, Phone, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/hooks/use-realtime";
import { LiveMap, type MapPoint } from "@/components/live-map";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { StatusBadge } from "@/components/status-badge";
import { DonationImages } from "@/components/donation-images";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { distanceKm, etaMinutes, formatAgo, progressPercent } from "@/lib/tracking";

export const Route = createFileRoute("/track/$id")({
  head: () => ({
    meta: [
      { title: "Live donation tracking — ShareAt" },
      { name: "description", content: "Follow your donation pickup live: volunteer location, distance and ETA." },
      { property: "og:title", content: "Live donation tracking — ShareAt" },
      { property: "og:description", content: "Track your ShareAt pickup in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const [tick, setTick] = useState(0);

  useRealtime(`track-${id}`, ["donations", "donation_events", "volunteer_locations"]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const donation = useQuery({
    queryKey: ["track-donation", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const events = useQuery({
    queryKey: ["track-events", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_events")
        .select("*")
        .eq("donation_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const volunteerId = donation.data?.volunteer_id ?? null;

  const volunteer = useQuery({
    queryKey: ["track-volunteer", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const [{ data: profile }, { data: loc }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, avatar_url").eq("id", volunteerId!).maybeSingle(),
        supabase.from("volunteer_locations").select("*").eq("volunteer_id", volunteerId!).maybeSingle(),
      ]);
      return { profile, loc };
    },
  });

  const d = donation.data;
  const loc = volunteer.data?.loc;

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    if (d?.pickup_lat && d?.pickup_lng)
      out.push({ id: "pickup", lat: d.pickup_lat, lng: d.pickup_lng, label: "Pickup address", kind: "user" });
    if (d?.ngo_lat && d?.ngo_lng)
      out.push({ id: "ngo", lat: d.ngo_lat, lng: d.ngo_lng, label: d.ngo_name ?? "NGO", kind: "ngo" });
    if (loc) out.push({ id: "vol", lat: loc.lat, lng: loc.lng, label: "Volunteer", kind: "volunteer" });
    return out;
  }, [d, loc]);

  const route = useMemo<[number, number][] | undefined>(() => {
    if (!loc || !d?.pickup_lat || !d?.pickup_lng) return undefined;
    return [
      [loc.lat, loc.lng],
      [d.pickup_lat, d.pickup_lng],
    ];
  }, [loc, d]);

  const km =
    loc && d?.pickup_lat && d?.pickup_lng
      ? distanceKm([loc.lat, loc.lng], [d.pickup_lat, d.pickup_lng])
      : null;

  if (loading || donation.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">Donation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been removed or you don't have access.</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Back">
              <Link to="/dashboard">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{d.title}</h1>
              <p className="text-xs text-muted-foreground">Order #{d.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <StatusBadge status={d.status} />
        </div>

        <Card className="glass-card gap-4 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Delivery progress</span>
            <span className="text-muted-foreground">{progressPercent(d.status)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="gradient-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent(d.status)}%` }}
            />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Card className="gap-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Live map</h2>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="size-3" /> updated {formatAgo(loc?.updated_at)}
                </span>
              </div>
              {points.length === 0 ? (
                <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                  Live location appears once the volunteer starts the journey.
                </p>
              ) : (
                <LiveMap points={points} route={route} height={340} recenterKey={String(tick)} />
              )}
              {km !== null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Navigation className="size-3.5" /> Distance away
                    </p>
                    <p className="text-lg font-semibold">{km.toFixed(1)} km</p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Estimated arrival
                    </p>
                    <p className="text-lg font-semibold">{etaMinutes(km)} min</p>
                  </div>
                </div>
              )}
            </Card>

            {volunteer.data?.profile && (
              <Card className="flex-row items-center gap-4 p-5">
                <span className="gradient-primary flex size-12 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground">
                  {volunteer.data.profile.full_name?.charAt(0).toUpperCase() ?? "V"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{volunteer.data.profile.full_name || "Volunteer"}</p>
                  <p className="text-xs text-muted-foreground">Your pickup partner</p>
                </div>
                {volunteer.data.profile.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${volunteer.data.profile.phone}`}>
                      <Phone className="mr-1 size-4" /> Call
                    </a>
                  </Button>
                )}
              </Card>
            )}

            <Card className="gap-3 p-5">
              <h2 className="text-base font-semibold">Pickup details</h2>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {d.pickup_address}, {d.city} · {d.pickup_date ?? "—"} {d.pickup_time ?? ""}
              </p>
              <DonationImages paths={d.images} />
              {(d.collection_photo || d.delivery_photo) && (
                <>
                  <p className="text-xs font-medium text-muted-foreground">Delivery proof</p>
                  <DonationImages
                    paths={[d.collection_photo, d.delivery_photo].filter(Boolean) as string[]}
                    size="size-20"
                  />
                </>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold">Tracking timeline</h2>
            <TrackingTimeline status={d.status} events={events.data ?? []} />
          </Card>
        </div>
      </div>
    </div>
  );
}
