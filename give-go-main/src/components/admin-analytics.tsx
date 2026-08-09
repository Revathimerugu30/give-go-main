import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, FileText, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { co2SavedKg, downloadExcel, downloadFile, printReport, toCSV } from "@/lib/rewards";
import { useDonorLeaderboard, useVolunteerLeaderboard } from "@/hooks/use-rewards";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const monthKey = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

export function AdminAnalytics() {
  useRealtime("admin-analytics", ["donations", "reward_points", "profiles"]);

  const { data: donations, isLoading } = useQuery({
    queryKey: ["analytics-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("id,title,category,city,status,created_at,updated_at,quantity,volunteer_id")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const donors = useDonorLeaderboard("all");
  const volunteers = useVolunteerLeaderboard();
  const rows = donations ?? [];

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; donations: number; completed: number }>();
    rows.forEach((d) => {
      const k = monthKey(d.created_at);
      const e = map.get(k) ?? { month: k, donations: 0, completed: 0 };
      e.donations += 1;
      if (d.status === "completed" || d.status === "delivered") e.completed += 1;
      map.set(k, e);
    });
    return [...map.values()].slice(-12);
  }, [rows]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((d) => map.set(d.category, (map.get(d.category) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((d) => map.set(d.city, (map.get(d.city) ?? 0) + 1));
    return [...map.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rows]);

  const statusSplit = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((d) => map.set(d.status, (map.get(d.status) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const completed = rows.filter((d) => d.status === "completed" || d.status === "delivered");
  const items = completed.reduce((s, d) => s + (d.quantity ?? 1), 0);
  const successRate = rows.length ? Math.round((completed.length / rows.length) * 100) : 0;

  const exportRows = () =>
    rows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      city: d.city,
      status: d.status,
      quantity: d.quantity,
      created_at: d.created_at,
    }));

  const exportPdf = () =>
    printReport("ShareAt platform report", [
      {
        heading: "Summary",
        rows: [
          ["Metric", "Value"],
          ["Total donations", String(rows.length)],
          ["Completed donations", String(completed.length)],
          ["Success rate", `${successRate}%`],
          ["Items reused", String(items)],
          ["CO₂ saved (kg)", String(co2SavedKg(items))],
        ],
      },
      {
        heading: "Top donors",
        rows: [
          ["Donor", "City", "Points", "Donations"],
          ...(donors.data ?? [])
            .slice(0, 10)
            .map((d) => [d.full_name || "—", d.city || "—", String(d.points), String(d.donations)]),
        ],
      },
      {
        heading: "Volunteer performance",
        rows: [
          ["Volunteer", "Completed", "Avg pickup (min)", "Rating"],
          ...(volunteers.data ?? [])
            .slice(0, 10)
            .map((v) => [
              v.full_name || "—",
              String(v.completed),
              v.avg_pickup_minutes ? String(Math.round(v.avg_pickup_minutes)) : "—",
              v.rating ? v.rating.toFixed(1) : "—",
            ]),
        ],
      },
    ]);

  if (isLoading)
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Analytics & impact</h2>
          <p className="text-sm text-muted-foreground">
            Live figures — {items} items reused, ~{co2SavedKg(items)} kg CO₂ saved.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadFile("shareat-donations.csv", toCSV(exportRows()), "text/csv")}>
            <Download className="mr-1.5 size-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadExcel("shareat-donations.xls", exportRows())}>
            <FileSpreadsheet className="mr-1.5 size-4" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <FileText className="mr-1.5 size-4" /> PDF report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Donations per month" hint="Submitted vs completed">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" fontSize={12} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="donations" stroke="var(--color-chart-1)" fill="url(#gA)" />
              <Line type="monotone" dataKey="completed" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category distribution" hint="Share of all donations">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top cities" hint="Where donations come from">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="city" fontSize={12} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Volunteer performance" hint="Completed pickups per volunteer">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(volunteers.data ?? []).slice(0, 8).map((v) => ({ name: v.full_name || "—", completed: v.completed, assigned: v.assigned }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="assigned" radius={[8, 8, 0, 0]} fill="var(--color-chart-3)" />
              <Bar dataKey="completed" radius={[8, 8, 0, 0]} fill="var(--color-chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status pipeline" hint="Live distribution across the delivery flow">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusSplit} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} fontSize={11} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--color-chart-5)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reward points awarded" hint="Top donors, all time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={(donors.data ?? []).slice(0, 10).map((d) => ({ name: d.full_name || "—", points: Number(d.points) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="points" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="glass-card flex flex-wrap items-center gap-6 p-5">
        <Stat label="Success rate" value={`${successRate}%`} />
        <Stat label="Items reused" value={items.toLocaleString()} />
        <Stat label="CO₂ saved" value={`${co2SavedKg(items)} kg`} />
        <Stat label="Active volunteers" value={String((volunteers.data ?? []).length)} />
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="size-3.5 text-success" /> Updates live
        </span>
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card animate-rise gap-2 p-5">
      <p className="font-medium">{title}</p>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
