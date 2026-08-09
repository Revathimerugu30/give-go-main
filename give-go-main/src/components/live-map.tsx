import { Suspense, lazy, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "./live-map-impl";

export type { MapPoint };

const Impl = lazy(() => import("./live-map-impl"));

/** SSR-safe wrapper: Leaflet only loads in the browser after hydration. */
export function LiveMap(props: {
  points: MapPoint[];
  route?: [number, number][];
  height?: number;
  recenterKey?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="w-full rounded-2xl" style={{ height: props.height ?? 320 }} />;
  return (
    <Suspense fallback={<Skeleton className="w-full rounded-2xl" style={{ height: props.height ?? 320 }} />}>
      <Impl {...props} />
    </Suspense>
  );
}
