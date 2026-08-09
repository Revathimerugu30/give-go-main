/**
 * Reward points, badges, achievements and report helpers.
 * Point values live in the `reward_config` table (admin editable);
 * these constants are only used as display fallbacks.
 */

export interface BadgeTier {
  name: string;
  min: number;
  icon: string;
  emoji: string;
  description: string;
  ring: string;
  chip: string;
  glow: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    name: "Bronze Donor",
    min: 0,
    icon: "medal",
    emoji: "🥉",
    description: "Starting your giving journey.",
    ring: "from-amber-700 to-amber-500",
    chip: "bg-amber-600/15 text-amber-700 dark:text-amber-400",
    glow: "shadow-[0_0_30px_-8px_rgba(180,83,9,0.6)]",
  },
  {
    name: "Silver Donor",
    min: 100,
    icon: "award",
    emoji: "🥈",
    description: "A steady, generous contributor.",
    ring: "from-slate-400 to-slate-200",
    chip: "bg-slate-400/20 text-slate-600 dark:text-slate-300",
    glow: "shadow-[0_0_30px_-8px_rgba(148,163,184,0.7)]",
  },
  {
    name: "Gold Donor",
    min: 300,
    icon: "trophy",
    emoji: "🥇",
    description: "A pillar of the community.",
    ring: "from-yellow-500 to-amber-300",
    chip: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    glow: "shadow-[0_0_34px_-8px_rgba(234,179,8,0.75)]",
  },
  {
    name: "Super Donor",
    min: 600,
    icon: "crown",
    emoji: "🏆",
    description: "Legendary impact on families in need.",
    ring: "from-primary to-chart-4",
    chip: "bg-primary/15 text-primary",
    glow: "shadow-[0_0_36px_-6px_var(--color-primary)]",
  },
];

export function badgeFor(points: number): BadgeTier {
  return [...BADGE_TIERS].reverse().find((b) => points >= b.min) ?? BADGE_TIERS[0]!;
}

export function nextBadge(points: number): BadgeTier | null {
  return BADGE_TIERS.find((b) => b.min > points) ?? null;
}

/** 0-100 progress towards the next badge (100 when already at the top tier). */
export function badgeProgress(points: number) {
  const current = badgeFor(points);
  const next = nextBadge(points);
  if (!next) return 100;
  const span = next.min - current.min;
  return Math.min(100, Math.round(((points - current.min) / span) * 100));
}

export const DEFAULT_CATEGORY_POINTS: Record<string, number> = {
  Clothes: 10,
  Household: 15,
  "Household Items": 15,
  Books: 8,
  Furniture: 25,
  Electronics: 30,
  Toys: 8,
  Other: 10,
};

export const ACHIEVEMENT_EMOJI: Record<string, string> = {
  first_donation: "🏅",
  five_donations: "🎁",
  deliveries_25: "🚚",
  helped_100: "🌍",
  streak_30: "🔥",
  top_donor_month: "⭐",
  volunteer_month: "🏆",
  super_donor: "👑",
};

/** Rough environmental impact: ~2.1 kg CO2 saved per reused item. */
export const co2SavedKg = (items: number) => Math.round(items * 2.1 * 10) / 10;

/* ---------------- report export helpers ---------------- */

export function toCSV(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Excel-compatible export (SpreadsheetML-free: Excel opens CSV with BOM natively). */
export function downloadExcel(filename: string, rows: Record<string, unknown>[]) {
  downloadFile(filename, "\uFEFF" + toCSV(rows), "application/vnd.ms-excel;charset=utf-8");
}

/** Simple print-to-PDF report window with stats table. */
export function printReport(title: string, sections: { heading: string; rows: string[][] }[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const table = (rows: string[][]) =>
    `<table>${rows
      .map(
        (r, i) =>
          `<tr>${r.map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`,
      )
      .join("")}</table>`;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:ui-sans-serif,system-ui;padding:32px;color:#123}
    h1{font-size:22px;margin:0 0 4px} h2{font-size:15px;margin:26px 0 8px;color:#166534}
    p.sub{color:#667;margin:0 0 12px;font-size:12px}
    table{border-collapse:collapse;width:100%;font-size:12px}
    th,td{border:1px solid #dde;padding:6px 8px;text-align:left}
    th{background:#f3f7f4}
  </style></head><body>
    <h1>${title}</h1><p class="sub">ShareAt · generated ${new Date().toLocaleString()}</p>
    ${sections.map((s) => `<h2>${s.heading}</h2>${table(s.rows)}`).join("")}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
