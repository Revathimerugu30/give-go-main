import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: "user" | "volunteer" | "ngo";
}

const COLORS: Record<MapPoint["kind"], string> = {
  user: "#2563eb",
  volunteer: "#16a34a",
  ngo: "#d97706",
};

const ICONS: Record<MapPoint["kind"], string> = {
  user: "🏠",
  volunteer: "🚚",
  ngo: "🏢",
};

function icon(p: MapPoint) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${COLORS[p.kind]};color:#fff;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,.25);border:2px solid #fff">${ICONS[p.kind]}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/** Imperative Leaflet/OpenStreetMap map with live-moving markers and a route line. */
export default function LiveMapImpl({
  points,
  route,
  height = 320,
  recenterKey,
}: {
  points: MapPoint[];
  route?: [number, number][];
  height?: number;
  recenterKey?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const line = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
      markers.current = {};
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const seen = new Set<string>();
    points.forEach((p) => {
      seen.add(p.id);
      const existing = markers.current[p.id];
      if (existing) {
        existing.setLatLng([p.lat, p.lng]);
        existing.setTooltipContent(p.label);
      } else {
        markers.current[p.id] = L.marker([p.lat, p.lng], { icon: icon(p) })
          .bindTooltip(p.label, { direction: "top", offset: [0, -18] })
          .addTo(m);
      }
    });
    Object.keys(markers.current).forEach((id) => {
      if (!seen.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    if (line.current) {
      line.current.remove();
      line.current = null;
    }
    if (route && route.length > 1) {
      line.current = L.polyline(route, { color: "#16a34a", weight: 4, opacity: 0.7, dashArray: "8 8" }).addTo(m);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      m.fitBounds(bounds.pad(0.35), { maxZoom: 15, animate: true });
    }
  }, [points, route, recenterKey]);

  return <div ref={el} style={{ height }} className="w-full overflow-hidden rounded-2xl border border-border/70" />;
}
