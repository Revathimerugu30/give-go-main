import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending review", className: "bg-warning/15 text-warning-foreground" },
  approved: { label: "Approved", className: "bg-primary/15 text-primary" },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
  assigned: { label: "Volunteer assigned", className: "bg-chart-4/15 text-chart-4" },
  accepted: { label: "Pickup accepted", className: "bg-chart-4/20 text-chart-4" },
  traveling: { label: "On the way", className: "bg-primary/15 text-primary" },
  near_pickup: { label: "Near pickup", className: "bg-primary/25 text-primary" },
  collected: { label: "Collected", className: "bg-accent/25 text-accent-foreground" },
  in_transit: { label: "On the way to NGO", className: "bg-chart-5/20 text-chart-5" },
  delivered: { label: "Delivered", className: "bg-success/15 text-success" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  failed: { label: "Pickup failed", className: "bg-destructive/15 text-destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`rounded-full border-0 ${s.className}`}>
      {s.label}
    </Badge>
  );
}
